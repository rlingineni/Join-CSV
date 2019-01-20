import { parse } from "papaparse";
import { readFileSync, writeFileSync } from "fs";
let converter = require("json-2-csv");
const joiner = require("joiner");

export default class JoinCSV {
	constructor(private csv1: string, private csv2: string, private left1: string, private right1: string) {}

	public async PerformJoin(RecordCleanFunction?: (nameOfCSV: string, record: any) => void): Promise<JoinedData> {
		//parse the path to CSV1
		let parsed1 = await this.parseCSVFile(this.csv1);
		//console.log(parsed1);

		//pass in the name of the CSV to the record cleanup function if cleanup is needed for the file
		if (RecordCleanFunction) {
			//iterate and pass each record back
			for (var record of parsed1) {
				RecordCleanFunction(this.csv1, record);
			}
		}

		//parse the path to CSV2
		let parsed2 = await this.parseCSVFile(this.csv2);

		//pass in the name of the CSV to the record cleanup function if cleanup is needed for the file
		if (RecordCleanFunction) {
			//iterate and pass each record back
			for (var record of parsed2) {
				RecordCleanFunction(this.csv2, record);
			}
		}

		//perform join on cleaned data
		var joinedRecords = joiner({
			leftData: parsed1,
			leftDataKey: this.left1,
			rightData: parsed2,
			rightDataKey: this.right1
		});

		//return cleaned data
		return joinedRecords as JoinedData;
	}

	public async convertData2CSV(data: any[], writePath?: string): Promise<string> {
		return new Promise<string>(function(resolve, reject) {
			converter.json2csv(data, (err: any, csv: string) => {
				if (err) {
					reject(err);
				}
				if (writePath) {
					writeFileSync(writePath, csv);
				}
				resolve(csv);
			});
		});
	}
	private parseCSVFile(pathToCSV: string): Promise<any[]> {
		const file = readFileSync(pathToCSV, "utf8");
		return new Promise(function(success, error) {
			parse(file, {
				header: true,
				complete: results => {
					success(results.data);
				},
				error: err => {
					console.log(err);
					error("Failed to Parse");
				}
			});
		});
	}
}

export interface JoinedData {
	data: any[];
	report: {
		diff: {
			a: any[];
			b: any[];
			a_and_b: any[];
			a_not_in_b: any[];
			b_not_in_a: any[];
		};
		prose: { summary: string; full: string };
	};
}