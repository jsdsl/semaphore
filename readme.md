# JSDSL - Semaphore

A Promise-based semaphore implementation.

### [Find @jsdsl/semaphore on NPM.](https://www.npmjs.com/package/@jsdsl/semaphore)

## Table of Contents

 - [Installation](#installation)
 - [Usage](#usage)
 - [License](#license)

## Installation

Install from NPM with

```
$ npm install --save @jsdsl/semaphore
```

## Usage

### An Overview of Semaphores

This package provides an implementation of a semaphore data structure, which seeks to restrict the number of accessors
that simultaneously have access to a given resource or set of resources.

In more literal terms, a semaphore distributes a limited number of locks (for example, `n` locks) before forcing
additional callers seeking locks to wait until enough locks have been released that distributing additional locks would
not put the semaphore 'over capacity' by distributing more than `n` locks.

---

### Getting Our First Lock

Initializing a semaphore and getting a lock is super simple! We just need to initialize a `Semaphore` and ask for a
lock!

```typescript
import { Semaphore, SemaphoreLock } from "@jsdsl/semaphore";

// This is the number of locks that we want to
// allow our semaphore to distribute simultaneously.
const n: number = 2;

let semaphore: Semaphore = new Semaphore(n);

let lock: SemaphoreLock = await semaphore.getLock();
```

There we go! We have our first lock!

---

### All Good Things Must End

Eventually, in order for the semaphore to really do anything for you, you're going to need to let it go.

Erm, rather, you're going to need to release the lock you've gotten. Don't worry though, it's still simple.

```typescript
lock.release();
```

Yep, a one-liner. Not that impressive. But still, you've now successfully acquired and released your first lock!

---

### Reaching the Limit

Acquiring and releasing locks is great and all, but it's _still_ not really going to get us anywhere. Perhaps
counterintuitively, the real power of semaphores isn't in what they _allow_ you to do, but rather in what they _don't_.

Semaphores _don't_ allow you to acquire more than `n` locks. This might seem trivially useful, but take for example a
situation in which you own a nightclub. You can only admit so many people at once, but your club is so popular that many
times more people want to party than you can fit. Well... the later people are just going to need to wait until some of
the earlier people leave:

```typescript
import { Semaphore, SemaphoreLock } from "@jsdsl/semaphore";

// Our nightclub can hold exactly 666 people!
const capacity: number = 666;

// But 2,500 people want to party at our nightclub!
const partygoers: number = 2500;

let lux: Semaphore = new Semaphore(capacity);

for (let i: number = 0; i < partygoers; i++) {
	
	// Enter the nightclub!
	let partygoer: SemaphoreLock = await lux.getLock();
	
}
```

Looks great right? Well, almost. We forgot something! Can you figure it out? Here's a hint: currently, only the first
666 partygoers will be able to enter the nightclub, and they will (_DUN, DUN, DUHHH...._) _never leave_.

We forgot to release the locks!

Let's let them party for a while, and then they can leave.

```typescript
import { Semaphore, SemaphoreLock } from "@jsdsl/semaphore";

// Our nightclub can hold exactly 666 people!
const capacity: number = 666;

// But 2,500 people want to party at our nightclub!
const partygoers: number = 2500;

let lux: Semaphore = new Semaphore(capacity);

for (let i: number = 0; i < partygoers; i++) {
	
	// Enter the nightclub!
	let partygoer: SemaphoreLock = await lux.getLock();
	
	// Let them leave after a little while.
	setTimeout((): void => partygoer.release(), Math.random() * PARTY_TIME);
	
}
```

---

### A More Concrete Example

If you're still a little confused as to the practical nature of a Semaphore, take this final example: imagine you're
scraping a website and trying not to annoy the site owner by bombarding their webserver with a bazillion concurrent
requests - a semaphore would be a great solution!

```typescript
import { Semaphore, SemaphoreLock } from "@jsdsl/semaphore";

// We don't want to to allow any more than 3 concurrent requests.
const ALLOWABLE_CONCURRENT_REQUESTS: number = 3;

let requestSemaphore: Semaphore = new Semaphore(capacity);

let scrapingPromises: Promise<ScrapedPage>[] = [];

for (let url of urlsToScrape) {
	
	scrapingPromises.push(new Promise<ScrapedPage>(
		(resolve: (value: ScrapedPage) => void): void => {
		
		requestSemaphore.getLock().then((lock: SemaphoreLock): void => {
			
			scrapePage(url).then((scrapedPage: ScrapedPage): void => {
				
				lock.release();
				resolve(scrapedPage);
				
			});
			
		});
		
	}));
	
}

await Promise.all(scrapingPromises);

// All pages have been asynchronously scraped while still
// ensuring we're not bombarding some poor webmaster's server!
```

Ignoring the callback-hell that we've created, we have nonetheless successfully ensured that we only ever have a maximum
of 3 concurrent outgoing requests to the webserver at any given time! Cool!

As a small bonus, let's look at how we can (slightly) clean up that callback mess.

---

### A Shorthand For `get lock --> use lock --> release lock`

When using semaphores, there is a recurring pattern of:

 - Wait to acquire the lock that we need to be able to safely perform our desired operation.
 - Perform our desired operation.
 - Release the lock so that others may use it.

Having to type out the full semaphore idiom every time is needlessly verbose and can lead to errors if a lock is
forgotten. Here's that full idiom we're talking about - you might recognize it from the last example:

```typescript
semaphore.getLock().then((lock: SemaphoreLock): void => {
	
	doStuff();
	
	lock.release();

});

// Or with async/await, we can get a -little- cleaner, but still not great to
// have to type it out every time:

let lock: SemaphoreLock = await semaphore.getLock();

doStuff();

lock.release();
```

But not to worry, we have a solution! `Semaphore.performLockedOperation` allows us to do all of this in one step. This
method takes a callback and returns a Promise that will resolve to the return value of the provided callback.

```typescript
let stuffResult: Promise<MyType> = semaphore.performLockedOperation((): MyType => doStuff());
```

So what's actually happening here? Well it's actually really simple. Here's the entire method definition for
`performLockedOperation`:

```typescript
public async performLockedOperation<T>(operation: () => (T | PromiseLike<T>)): Promise<T> {
    
    let lock: SemaphoreLock = await this.getLock();
    
    let result: T = await operation();
    
    lock.release();
    
    return result;
    
}
```

All we're doing is getting a lock, performing our operation, and releasing the lock (and then returning the result of
the operation)! Just like before!

Keen observers might also note that callbacks returning Promises are also supported - if your callback returns a
Promise, `performLockedOperation` will wait for that Promise to resolve so that it can return the unwrapped result.

```typescript
async function searchForTheDetective(): Promise<Detective> { /* ... */ }

let detective: Detective = semaphore.performLockedOperation(searchForTheDetective);
```

So, if we were to try to clean up our earlier callback mess, it might look something like this:

```typescript
import { Semaphore, SemaphoreLock } from "@jsdsl/semaphore";

// We don't want to to allow any more than 3 concurrent requests.
const ALLOWABLE_CONCURRENT_REQUESTS: number = 3;

let requestSemaphore: Semaphore = new Semaphore(capacity);

let scrapingPromises: Promise<ScrapedPage>[] = [];

for (let url of urlsToScrape) {
	
	scrapingPromises.push(requestSemaphore.performLockedOperation(
		(): Promise<ScrapedPage> => scrapePage(url)
	));
	
}

await Promise.all(scrapingPromises);

// All pages have been asynchronously scraped while still
// ensuring we're not bombarding some poor webmaster's server!
```

---

### Other Potentially Useful Stuff

#### `semaphore.getLockCount()`

`semaphore.getLockCount()` returns a count of the number of locks distributed by the semaphore that are currently still
in circulation/in-use/unreleased.

```typescript
import { Semaphore } from "@jsdsl/semaphore";

let semaphore: Semaphore = new Semaphore(5);

await semaphore.getLock();
await semaphore.getLock();
await semaphore.getLock();

console.log(semaphore.getLockCount()); //=> 3
```

---

#### `semaphore.getMaximumLockCount()`

`semaphore.getMaximumLockCount()` returns a number representative of the maximum number of locks that can be
simultaneously distributed by this semaphore.

```typescript
import { Semaphore } from "@jsdsl/semaphore";

let semaphore: Semaphore = new Semaphore(42);

console.log(semaphore.getMaximumLockCount()); //=> 42
```

---

#### `lock.getID()`

`lock.getID()` returns the string ID of this lock, uniquely identifying it to it's issuing `Semaphore`.

```typescript
import { Semaphore, SemaphoreLock } from "@jsdsl/semaphore";

let lock: SemaphoreLock = await (new Semaphore(8)).getLock();

console.log(lock.getID()); //=> '1343ee064f8fd176b797a1ee5b84d862'
```

---

#### `lock.waitForRelease()`

`lock.then(...)` returns a Promise that will resolve to the string ID of this lock once this lock is released.

```typescript
import { Semaphore, SemaphoreLock } from "@jsdsl/semaphore";

let lock: SemaphoreLock = await (new Semaphore(16)).getLock();

setTimeout((): void => lock.release(), 2000);

lock.waitForRelease().then((): void => {
	
	console.log(`Lock released!`); //=> Will print after 2000 milliseconds.
	
});
```

## License

@jsdsl/semaphore is made available under the GNU General Public License v3.

Copyright (C) 2021 Trevor Sears
