import convertToJson, { parseArray, getBlock } from './convertToJson'
import Integer from './types/Integer'

const date = convertToUTCTimezone(new Date(2018, 3 - 1, 24, 12))

describe('convertToJson', () => {
	it('should parse arrays', () => {
		getBlock('abc"de,f"g,h', ',', 0).should.deep.equal(['abcde,fg', 10])
		parseArray(' abc"de,f"g  , h ').should.deep.equal(['abcde,fg', 'h'])
	})

	it('should convert to json', () => {
		const { rows, errors } = convertToJson([
			[
				'DATE',
				'NUMBER',
				'BOOLEAN',
				'STRING',
				'PHONE'
			], [
				'43183', // 03/24/2018',
				'123',
				'1',
				'abc',
				'(123) 456-7890'
			]
		], {
			DATE: {
				prop: 'date',
				type: Date,
				// template: 'MM/DD/YYYY',
			},
			NUMBER: {
				prop: 'number',
				type: Number
			},
			BOOLEAN: {
				prop: 'boolean',
				type: Boolean
			},
			STRING: {
				prop: 'string',
				type: String
			},
			PHONE: {
				prop: 'phone',
				parse(value) {
					return '+11234567890'
				}
			},
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			 date,
			 number: 123,
			 phone: '+11234567890',
			 boolean: true,
			 string: 'abc'
		}])
	})

	it('should require fields', () => {
		const { rows, errors } = convertToJson([
			[
				'NUMBER'
			], [
				null
			]
		], {
			NUMBER: {
				prop: 'number',
				type: Number,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'required',
			row: 1,
			column: 'NUMBER',
			type: Number,
			value: null
		}])

		rows.should.deep.equal([])
	})

	it('should parse arrays', () => {
		const { rows, errors } = convertToJson([
			[
				'NAMES'
			], [
				'Barack Obama, "String, with, colons", Donald Trump'
			], [
				null
			]
		], {
			NAMES: {
				prop: 'names',
				type: [String]
			}
		})

		errors.should.deep.equal([])

		rows.should.deep.equal([{
			names: ['Barack Obama', 'String, with, colons', 'Donald Trump']
		}])
	})

	it('should parse integers', () =>
	{
		const { rows, errors } = convertToJson([
			[
				'INTEGER'
			], [
				'1'
			], [
				'1.2'
			]
		], {
			INTEGER: {
				prop: 'value',
				type: Integer
			}
		})

		errors.length.should.equal(1)
		errors[0].row.should.equal(2)
		errors[0].column.should.equal('INTEGER')
		errors[0].error.should.equal('invalid')

		rows.should.deep.equal([{
			value: 1
		}])
	})

	it('should call .validate()', () => {
		const { rows, errors } = convertToJson([
			[
				'NAME'
			], [
				'George Bush'
			]
		], {
			NAME: {
				prop: 'name',
				type: String,
				required: true,
				validate: (value) => {
					if (value === 'George Bush') {
						throw new Error('custom-error')
					}
				}
			}
		})

		errors.should.deep.equal([{
			error: 'custom-error',
			row: 1,
			column: 'NAME',
			type: String,
			value: 'George Bush'
		}])

		rows.should.deep.equal([])
	})

	it('should validate numbers', () => {
		const { rows, errors } = convertToJson([
			[
				'NUMBER'
			], [
				'123abc'
			]
		], {
			NUMBER: {
				prop: 'number',
				type: Number,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			row: 1,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}])

		rows.should.deep.equal([])
	})

	it('should validate booleans', () => {
		const { rows, errors } = convertToJson([
			[
				'TRUE',
				'FALSE',
				'INVALID'
			], [
				'1',
				'0',
				'TRUE'
			]
		], {
			TRUE: {
				prop: 'true',
				type: Boolean,
				required: true
			},
			FALSE: {
				prop: 'false',
				type: Boolean,
				required: true
			},
			INVALID: {
				prop: 'invalid',
				type: Boolean,
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			row: 1,
			column: 'INVALID',
			type: Boolean,
			value: 'TRUE'
		}])

		rows.should.deep.equal([{
			true: true,
			false: false
		}])
	})

	it('should validate dates', () => {
		const { rows, errors } = convertToJson([
			[
				'DATE',
				'INVALID'
			], [
				'43183', // 03/24/2018',
				'-'
			]
		], {
			DATE: {
				prop: 'date',
				type: Date,
				// template: 'MM/DD/YYYY',
				required: true
			},
			INVALID: {
				prop: 'invalid',
				type: Date,
				// template: 'MM/DD/YYYY',
				required: true
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			row: 1,
			column: 'INVALID',
			type: Date,
			value: '-'
		}])

		rows.should.deep.equal([{
			date
		}])
	})

	it('should throw parse() errors', () => {
		const { rows, errors } = convertToJson([
			[
				'PHONE'
			], [
				'123'
			]
		], {
			PHONE: {
				prop: 'phone',
				parse: () => {
					throw new Error('invalid')
				}
			}
		})

		errors.should.deep.equal([{
			error: 'invalid',
			row: 1,
			column: 'PHONE',
			value: '123'
		}])

		rows.should.deep.equal([])
	})

	it('should map row numbers', () => {
		const { rows, errors } = convertToJson([
			[
				'NUMBER'
			], [
				'123abc'
			]
		], {
			NUMBER: {
				prop: 'number',
				type: Number
			}
		}, {
			rowMap: [2, 5]
		})

		errors.should.deep.equal([{
			error: 'invalid',
			row: 6,
			column: 'NUMBER',
			type: Number,
			value: '123abc'
		}])
	})
})


// Converts timezone to UTC while preserving the same time
function convertToUTCTimezone(date) {
	// Doesn't account for leap seconds but I guess that's ok
	// given that javascript's own `Date()` does not either.
	// https://www.timeanddate.com/time/leap-seconds-background.html
	//
	// https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
	//
	return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
}
