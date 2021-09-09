/*
 * Created by Trevor Sears <trevor@trevorsears.com> (https://trevorsears.com/).
 * 3:09 PM -- September 09, 2021.
 * Project: @jsdsl/semaphore
 */

import "promise-any-polyfill";
import crypto from "crypto";
import { SemaphoreLock } from "./semaphore-lock";

type OutstandingLockMap = {
	
	[id: string]: Promise<string>
	
}

export class Semaphore {
	
	protected readonly maxLockCount: number;
	
	protected outstandingLocks: OutstandingLockMap;
	
	public constructor(maxLockCount: number) {
		
		this.maxLockCount = maxLockCount;
		this.outstandingLocks = {};
		
	}

	public async getLock(): Promise<SemaphoreLock> {
		
		// While we are at or (hopefully not) above capacity...
		while (this.getLockCount() >= this.getMaximumLockCount()) {
			
			console.log(`Waiting to remove promise...`);
			
			let resolution: any = await Promise.any(Object.values(this.outstandingLocks))
			
			console.log(`resolution: ${resolution}`);
			
			// Remove the first resolved promise that we find.
			delete this.outstandingLocks[resolution];
			
			console.log(`...found promise to remove!`);
			
		}
		
		console.log(`Generating new lock.`);
		
		let id: string = crypto.randomBytes(16).toString("hex");
		
		let lock: SemaphoreLock = new SemaphoreLock(id);
		
		this.outstandingLocks[id] = lock.onRelinquish();
		
		return lock;
		
	}
	
	public getLockCount(): number {
		
		return Object.keys(this.outstandingLocks).length;
		
	}
	
	public getMaximumLockCount(): number {
		
		return this.maxLockCount;
		
	}
	
}
