import { useState, useRef } from 'react'
import { Upload, FileJson, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { apiClient } from '@/services/api'

interface ImportResult {
  total_records: number
  successful: number
  failed: number
  errors: string[]
  warnings: string[]
}

export function BulkImportModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: (result: ImportResult) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel']
    const validExtensions = ['.csv', '.json']

    const hasValidExtension = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    )
    const hasValidType = validTypes.includes(selectedFile.type) || hasValidExtension

    if (!hasValidType) {
      setError('Please upload a CSV or JSON file')
      return
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File must be smaller than 50MB')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post('/members/import/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setResult(response.data as ImportResult)
      onSuccess(response.data as ImportResult)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Import failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Import Members</h2>
          <p className="text-gray-600 mt-1">Import members from CSV or JSON file</p>
        </div>

        <div className="p-6 space-y-6">
          {!result ? (
            <>
              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      {file.name.endsWith('.json') ? (
                        <FileJson className="w-12 h-12 text-blue-500" />
                      ) : (
                        <FileText className="w-12 h-12 text-green-500" />
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReset()
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <p className="font-medium text-gray-900">
                      Drag and drop your file here
                    </p>
                    <p className="text-sm text-gray-600">
                      or click to select CSV or JSON file
                    </p>
                  </div>
                )}
              </div>

              {/* File Format Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Supported Formats</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    <strong>CSV:</strong> name, phone, email, date_of_birth, membership_type, start_date
                  </p>
                  <p>
                    <strong>JSON:</strong> Array of objects or object with 'data' or 'records' key
                  </p>
                  <p className="text-xs mt-2">Required fields: name, phone</p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Import Result */
            <div className="space-y-4">
              <div className="text-center">
                {result.failed === 0 ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Import Successful!</h3>
                  </>
                ) : result.successful > 0 ? (
                  <>
                    <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Partial Import
                    </h3>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Import Failed</h3>
                  </>
                )}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <p className="text-2xl font-bold text-gray-900">{result.total_records}</p>
                  <p className="text-sm text-gray-600">Total Records</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <p className="text-2xl font-bold text-green-600">{result.successful}</p>
                  <p className="text-sm text-gray-600">Successful</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Errors</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-red-800">
                        • {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-900 mb-2">Warnings</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.warnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-amber-800">
                        • {warning}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleReset()
                    onClose()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
