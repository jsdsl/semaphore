/*
 * Created by Trevor Sears <trevor@trevorsears.com> (https://trevorsears.com/).
 * 3:09 PM -- September 09, 2021.
 * Project: @jsdsl/semaphore
 * 
 * @jsdsl/semaphore - A Promise-based semaphore implementation.
 * Copyright (C) 2021 Trevor Sears
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
