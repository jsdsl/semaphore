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

export class SemaphoreLock {
	
	protected readonly id: string;
	
	protected relinquishmentPromise: Promise<string>;
	
	protected relinquisherFunction!: () => void;

	public constructor(id: string) {
		
		this.id = id;
		
		this.relinquishmentPromise = new Promise<string>((resolve: (id: string) => void): void => {
			
			this.relinquisherFunction = (): void => resolve(this.id);
			
		});
		
	}
	
	public getID(): string {
		
		return this.id;
		
	}
	
	public relinquish(): void {
		
		this.relinquisherFunction();
		
	}
	
	public onRelinquish(): Promise<string> {
		
		return this.relinquishmentPromise;
		
	}
	
}
