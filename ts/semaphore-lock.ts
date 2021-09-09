/*
 * Created by Trevor Sears <trevor@trevorsears.com> (https://trevorsears.com/).
 * 3:09 PM -- September 09, 2021.
 * Project: @jsdsl/semaphore
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
