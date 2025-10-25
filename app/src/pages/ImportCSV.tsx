import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  ArrowLeft,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  updated?: number;
  skipped: number;
  errors?: string[];
}

const ImportCSV: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setImportResult(null);
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setImportResult(null);
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await axios.post<ImportResult>(`${API_BASE_URL}/import/csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);

      if (response.data.success) {
        toast.success(response.data.message);
        // Reset form after successful import
        setTimeout(() => {
          setFile(null);
          setImportResult(null);
          navigate('/issues');
        }, 2000);
      } else {
        toast.error('Import completed with errors');
      }
    } catch (error: any) {
      console.error('Failed to import CSV:', error);
      const errorMessage = error.response?.data?.message || 'Failed to import CSV';
      toast.error(errorMessage);

      if (error.response?.data?.errors) {
        setImportResult({
          success: false,
          message: errorMessage,
          imported: 0,
          updated: 0,
          skipped: 0,
          errors: error.response.data.errors,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `title,description,site,severity,status,createdAt
"Missing consent form","Consent form not in file for patient 003","Site-101","major","open","2025-05-01T09:00:00Z"
"Late visit","Visit week 4 occurred on week 6","Site-202","minor","in_progress","2025-05-03T12:30:00Z"
"Drug temp excursion","IP stored above max temp for 6 hours","Site-101","critical","open","2025-05-10T08:15:00Z"
"Unblinded email","Coordinator emailed treatment arm to CRA","Site-303","major","resolved","2025-05-14T16:00:00Z"`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_issues.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/issues"
          className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Issues
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Import Issues from CSV
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Upload a CSV file to bulk import issues
        </p>
      </div>

      {/* Upload Area */}
      <div className="card p-6 mb-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
          />

          {!file ? (
            <>
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <label htmlFor="csv-file-input" className="btn btn-primary cursor-pointer mb-3">
                Choose CSV File
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or drag and drop your file here
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                CSV files only, up to 5MB
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center">
              <FileText className="h-12 w-12 text-primary-600 mr-4" />
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          )}
        </div>

        {/* Import Button */}
        {file && !importResult && (
          <div className="mt-4">
            <button onClick={handleUpload} disabled={uploading} className="btn btn-primary w-full">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Issues
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Import Result */}
      {importResult && (
        <div
          className={cn(
            'card p-6 mb-6',
            importResult.success
              ? 'border-success-200 bg-success-50 dark:bg-success-900/10 dark:border-success-800'
              : 'border-danger-200 bg-danger-50 dark:bg-danger-900/10 dark:border-danger-800'
          )}
        >
          <div className="flex items-start">
            {importResult.success ? (
              <CheckCircle className="h-5 w-5 text-success-600 mr-3 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-danger-600 mr-3 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {importResult.message}
              </h3>
              <div className="mt-2 space-y-1 text-sm">
                {importResult.imported > 0 && (
                  <p className="text-success-700 dark:text-success-400">
                    ✓ {importResult.imported} new issues added
                  </p>
                )}
                {importResult.updated && importResult.updated > 0 && (
                  <p className="text-info-700 dark:text-info-400">
                    ↻ {importResult.updated} existing issues updated
                  </p>
                )}
                {importResult.skipped > 0 && (
                  <p className="text-warning-700 dark:text-warning-400">
                    ⚠ {importResult.skipped} issues skipped
                  </p>
                )}
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-danger-700 dark:text-danger-400">
                    Errors:
                  </p>
                  <ul className="mt-1 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="text-xs text-danger-600 dark:text-danger-400">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card p-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              CSV Format Requirements
            </h3>

            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Required columns:
                </p>
                <ul className="space-y-0.5 ml-4">
                  <li>
                    •{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                      title
                    </code>{' '}
                    - Issue title (required)
                  </li>
                  <li>
                    •{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                      description
                    </code>{' '}
                    - Detailed description (required)
                  </li>
                  <li>
                    •{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                      site
                    </code>{' '}
                    - Site identifier (required)
                  </li>
                  <li>
                    •{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                      severity
                    </code>{' '}
                    - minor, major, or critical (required)
                  </li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Optional columns:
                </p>
                <ul className="space-y-0.5 ml-4">
                  <li>
                    •{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                      status
                    </code>{' '}
                    - open, in_progress, or resolved (defaults to open)
                  </li>
                  <li>
                    •{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                      createdAt
                    </code>{' '}
                    - ISO 8601 date format
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <button onClick={downloadSampleCSV} className="btn btn-ghost">
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCSV;
