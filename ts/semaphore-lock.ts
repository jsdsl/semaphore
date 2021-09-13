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

/**
 * A lock whose holder is being guaranteed some form of mutual exclusion to a resource, as provided by the issuing
 * {@link Semaphore}.
 * 
 * @author Trevor Sears <trevor@trevorsears.com> (https://trevorsears.com/)
 * @version v1.0.0
 * @since v0.1.0
 */
export class SemaphoreLock {
	
	/**
	 * The string ID of this lock, uniquely identifying it to it's issuing {@link Semaphore}.
	 */
	protected readonly id: string;
	
	/**
	 * A Promise that resolves once this lock has been released.
	 */
	protected releasePromise: Promise<string>;
	
	/**
	 * A function that is used internally to release this lock.
	 * 
	 * This is a reference to the `#resolve` callback of the `releasePromise` Promise belonging to this lock.
	 */
	protected releaseFunction!: (id: string) => void;
	
	/**
	 * Initializes a new SemaphoreLock instance with the provided ID.
	 * 
	 * @param {string} id The string ID of this lock that should uniquely identify it to it's issuing {@link Semaphore}.
	 */
	public constructor(id: string) {
		
		this.id = id;
		
		this.releasePromise = new Promise<string>((resolve: (id: string) => void): void => {
			
			this.releaseFunction = resolve;
			
		});
		
	}
	
	/**
	 * Returns the string ID of this lock, uniquely identifying it to it's issuing {@link Semaphore}.
	 * 
	 * @returns {string} The string ID of this lock.
	 */
	public getID(): string {
		
		return this.id;
		
	}
	
	/**
	 * Releases this lock, relinquishing the resource(s) being held by this lock back to its parent {@link Semaphore}.
	 */
	public release(): void {
		
		this.releaseFunction(this.getID());
		
	}
	
	/**
	 * Returns a Promise that will resolve to the string ID of this lock once this lock is released.
	 *
	 * @returns {Promise<string>} A Promise that will resolve to the string ID of this lock once this lock is released.
	 */
	public waitForRelease(): Promise<string> {
		
		return this.releasePromise;
		
	}
	
}
