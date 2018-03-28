import unpackXlsxFile from './unpackXlsxFileNode'
import xml from './xml'
import readXlsx from './readXlsx'
import convertToJson from './convertToJson'

/**
 * Reads XLSX file into a 2D array of cells in a browser.
 * @param  {(string|Stream)} input - A Node.js readable stream or a path to a file.
 * @param  {object?} options
 * @param  {string?} options.sheet - Excel document sheet to read. Defaults to `1`. Will only read this sheet and skip others.
 * @return {Promise} Resolves to a 2D array of cells: an array of rows, each row being an array of cells.
 */
export default function readXlsxFile(input, options = {}) {
	// Deprecated 1.0.0 `sheet` argument. Will be removed in some next major release.
	if (typeof options === 'string' || typeof options === 'number') {
		options = { sheet: options }
	} else if (!options.sheet) {
		options.sheet = 1
	}
	return unpackXlsxFile(input, options)
		.then(entries => readXlsx(entries, xml, options))
		.then((rows) => {
			if (options.schema) {
				return convertToJson(rows, options.schema, options)
			}
			return rows
		})
}