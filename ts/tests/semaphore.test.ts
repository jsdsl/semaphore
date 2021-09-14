/*
 * Created by Trevor Sears <trevor@trevorsears.com> (https://trevorsears.com/).
 * 8:33 AM -- September 14th, 2021
 * Project: @jsdsl/semaphore
 */

import { Semaphore } from "../semaphore";
import { SemaphoreLock } from "../semaphore-lock";

async function getLocks(semaphore: Semaphore, locks: number): Promise<SemaphoreLock[]> {
	
	let result: SemaphoreLock[] = [];
	
	for (let i: number = 0; i < locks; i++) result.push(await semaphore.getLock());
	
	return result;
	
}

function releaseLocks(...locks: SemaphoreLock[]): void {
	
	for (let lock of locks) lock.release();
	
}

function wait(ms: number): Promise<void> {
	
	return new Promise<void>((resolve: () => void): void => {
		
		setTimeout((): void => resolve(), ms);
		
	});
	
}

const n: number = 3;
let semaphore: Semaphore;
let locks: SemaphoreLock[];

describe("Semaphore", (): void => {
	
	beforeEach((): void => {
		
		semaphore = new Semaphore(n);
		locks = [];
		
	});
	
	afterEach((): void => {
		
		releaseLocks(...locks);
		
	});
	
	test("Semaphore#getMaximumLockCount returns the expected value.", async (): Promise<void> => {
		
		expect(semaphore.getMaximumLockCount()).toBe(n);
		
	});
	
	describe("Semaphore#getLockCount returns the expected value.", (): void => {
		
		test("0 locks", async (): Promise<void> => {
			
			expect(semaphore.getLockCount()).toBe(0);
			
		});
		
		test("1 lock", async (): Promise<void> => {
			
			await getLocks(semaphore, 1);
			
			expect(semaphore.getLockCount()).toBe(1);
			
		});
		
		test("n - 1 locks", async (): Promise<void> => {
			
			await getLocks(semaphore, n - 1);
			
			expect(semaphore.getLockCount()).toBe(n - 1);
			
		});
		
		test("n locks", async (): Promise<void> => {
			
			await getLocks(semaphore, n);
			
			expect(semaphore.getLockCount()).toBe(n);
			
		});
		
		test("n + 1 locks", async (): Promise<void> => {
			
			let expectation: Promise<void> = wait(1000).then((): void => expect(semaphore.getLockCount()).toBe(n));
			
			getLocks(semaphore, n + 1);
			
			await expectation;
			
		});
		
		test("n + 2 locks", async (): Promise<void> => {
			
			let expectation: Promise<void> = wait(1000).then((): void => expect(semaphore.getLockCount()).toBe(n));
			
			getLocks(semaphore, n + 2);
			
			await expectation;
			
		});
		
	});
	
	test("Locks are acquired in the expected order.", async (): Promise<void> => {
		
		for (let i: number = 0; i < n; i++) {
			
			let lock: SemaphoreLock = await semaphore.getLock();
			
			setTimeout((): void => lock.release(), i * 250);
			
			locks.push(lock);
			
		}
		
		let nextLockPromises: Promise<SemaphoreLock>[] = [];
		let ordering: number[] = [];
		
		for (let i: number = 0; i < 3; i++) {
			
			let lockPromise: Promise<SemaphoreLock> = semaphore.getLock();
			
			lockPromise.then((): any => ordering.push(i));
			
			nextLockPromises.push(lockPromise);
			
		}
		
		await Promise.all(nextLockPromises);
		
		expect(ordering).toStrictEqual([0, 1, 2]);
		
	});
	
	describe("Semaphore#performLockedOperation works as expected.", (): void => {
		
		async function testForNValue(n: number): Promise<void> {
			
			semaphore = new Semaphore(n);
			
			let criticalSectionObserverCount: number = 0;
			let operations: Promise<any>[] = [];
			
			const iterations: number = Math.min(10, n * 3);
			
			for (let i: number = 0; i < iterations; i++) {
				
				operations.push(semaphore.performLockedOperation(async (): Promise<void> => {
					
					expect(criticalSectionObserverCount).toBeLessThanOrEqual(n - 1);
					
					criticalSectionObserverCount++;
					
					expect(criticalSectionObserverCount).toBeLessThanOrEqual(n);
					
					await wait(250 + Math.random() * 250);
					
					expect(criticalSectionObserverCount).toBeLessThanOrEqual(n);
					
					criticalSectionObserverCount--;
					
					expect(criticalSectionObserverCount).toBeLessThanOrEqual(n - 1);
					
				}));
				
			}
			
			await Promise.all(operations);
			
		}
		
		test("For n = 1", async (): Promise<void> => {
			
			await testForNValue(1);
			
		}, 30_000);
		
		test("For n = 2", async (): Promise<void> => {
			
			await testForNValue(2);
			
		}, 30_000);
		
		test("For n = 3", async (): Promise<void> => {
			
			await testForNValue(3);
			
		}, 30_000);
		
		test("For n = 4", async (): Promise<void> => {
			
			await testForNValue(4);
			
		}, 30_000);
		
		test("For n = 5", async (): Promise<void> => {
			
			await testForNValue(5);
			
		}, 30_000);
		
		test("For n = 6", async (): Promise<void> => {
			
			await testForNValue(6);
			
		}, 30_000);
		
	});
	
});
