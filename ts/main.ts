/*
 *	Created by Trevor Sears <trevor@trevorsears.com> (https://trevorsears.com/).
 *	10:53 PM -- June 11th, 2019.
 *	Project: @jsdsl/semaphore
 */

/**
 * NPM main class used for exporting this package's contents.
 *
 * @author Trevor Sears <trevor@trevorsears.com> (https://trevorsears.com/)
 * @version v0.1.0
 * @since v0.1.0
 */

export { Semaphore } from "./semaphore";
export { SemaphoreLock } from "./semaphore-lock";

// @ts-ignore
import { Semaphore } from "./semaphore";
// @ts-ignore
import { SemaphoreLock } from "./semaphore-lock";

export async function main(): Promise<void> {
	
	let semaphore: Semaphore = new Semaphore(3);
	
	let count: number = 0;
	let locks: SemaphoreLock[] = [];
	
	for (let i: number = 0; i < 5; i++) {
		
		let lock: SemaphoreLock = await semaphore.getLock();
		
		locks.push(lock);
		console.log(`Got lock #${++count} (id: '${lock.getID()}')`);
		
	}
	
	console.log(`For loop finished...`);
	
	console.log(`Relinquishing lock #1...`);
	locks[0].relinquish();
	
}

main().catch((e: any) => console.error(e));
