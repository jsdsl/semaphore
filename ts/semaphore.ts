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

/**
 * A string mapping from lock IDs to their matching {@link SemaphoreLock}s.
 */
type OutstandingLockMap = {
	
	[id: string]: SemaphoreLock
	
}

/**
 * A implementation of a semaphore data structure, which seeks to restrict the number of accessors that simultaneously
 * have access to a given resource or set of resources.
 * 
 * @author Trevor Sears <trevor@trevorsears.com> (https://trevorsears.com/)
 * @version v1.1.0
 * @since v0.1.0
 */
export class Semaphore {
	
	/**
	 * The maximum number of locks that are allowed to be simultaneously distributed by this semaphore. 
	 */
	protected readonly maxLockCount: number;
	
	/**
	 * A mapping of lock IDs to their matching {@link SemaphoreLock}s, wherein each value in the map represents one
	 * unreleased lock that has been distributed by this semaphore.
	 */
	protected outstandingLocks: OutstandingLockMap;
	
	/**
	 * Initializes a new Semaphore with the provided maximum number of allowable distributed locks (defaults to 1).
	 * 
	 * @param {number} maxLockCount The maximum number of locks that are allowed to be simultaneously distributed by
	 * this semaphore.
	 */
	public constructor(maxLockCount: number = 1) {
		
		this.maxLockCount = maxLockCount;
		this.outstandingLocks = {};
		
	}
	
	/**
	 * Returns an array of Promises that each resolve to the ID of a lock belonging to this semaphore once that given
	 * lock is released.
	 * 
	 * Each of the returned Promises originates from an unreleased lock belonging to this semaphore.
	 * 
	 * @returns {Promise<string>[]} An array of Promises that each resolve to the ID of a lock belonging to this
	 * semaphore.
	 */
	protected getLockPromises(): Promise<string>[] {
		
		return Object.values(this.outstandingLocks).map(
			(lock: SemaphoreLock): Promise<string> => lock.waitForRelease()
		);
		
	}
	
	/**
	 * Returns a Promise that resolves to a SemaphoreLock once one is available.
	 * 
	 * The first n (where n = maxLockCount, the integer value provided in the constructor call) calls to `#getLock` will
	 * resolve 'instantly', whereas further calls will be forced to wait until the locks obtained by previous calls are
	 * released by their owners.
	 * 
	 * Once the resulting Promise resolves, the caller is guaranteed to be be one of the admitted frames (of a
	 * maximum of n admitted frames, where n = maxLockCount, the integer value provided in the constructor call) with
	 * access to the resource/critical section being 'guarded' by this semaphore.
	 * 
	 * @returns {Promise<SemaphoreLock>} A Promise that resolves to a SemaphoreLock once one is available.
	 */
	public async getLock(): Promise<SemaphoreLock> {
		
		// While we are at or (hopefully not) above capacity, wait for a lock to release.
		while (this.getLockCount() >= this.getMaximumLockCount()) await Promise.any(this.getLockPromises());
		
		let lockID: string;
		
		// Generate a unique ID for the new lock.
		do lockID = crypto.randomBytes(16).toString("hex");
		while (this.outstandingLocks.hasOwnProperty(lockID));
		
		// Add the new lock to the internal map of locks.
		this.outstandingLocks[lockID] = new SemaphoreLock(lockID);
		
		// Make the lock delete itself once it is relinquished.
		this.outstandingLocks[lockID].waitForRelease().then((): boolean => delete this.outstandingLocks[lockID]);
		
		return this.outstandingLocks[lockID];
		
	}
	
	/**
	 * Performs the specified operation/callback once a lock has been obtained, returning a Promise that will resolve
	 * to the return value of the operation once it is complete.
	 *
	 * Notes:
	 *  - The obtained lock will be automatically released once the provided operation is complete.
	 *  - If the provided callback returns a Promise, that result will be awaited as well.
	 *
	 * @param {() => (PromiseLike<T> | T)} operation The operation to perform once a lock is obtained.
	 * @returns {Promise<T>} A Promise that will resolve to the return value of the operation once it is complete.
	 */
	public async performLockedOperation<T>(operation: () => (T | PromiseLike<T>)): Promise<T> {
		
		let lock: SemaphoreLock = await this.getLock();
		
		try {

			return await operation();
			
		} catch (error: any) {
			
			throw error;
			
		} finally {
			
			lock.release();
			
		}
		
	}
	
	/**
	 * Returns a count of the number of locks distributed by this semaphore that are currently still in circulation/in-
	 * use/unreleased.
	 * 
	 * @returns {number} A count of the number of locks distributed by this semaphore that are currently still in
	 * circulation/in-use/unreleased.
	 */
	public getLockCount(): number {
		
		return Object.keys(this.outstandingLocks).length;
		
	}
	
	/**
	 * Returns a number representative of the maximum number of locks that can be simultaneously distributed by this
	 * semaphore.
	 * 
	 * @returns {number} A number representative of the maximum number of locks that can be simultaneously distributed
	 * by this semaphore.
	 */
	public getMaximumLockCount(): number {
		
		return this.maxLockCount;
		
	}
	
}
