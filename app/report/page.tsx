'use client'
import { useState, useEffect } from 'react'
import { MapPin, Upload, CheckCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  createUser,
  getUserByEmail,
  createReport,
  getRecentReports,
} from '@/utils/db/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string

interface User {
  id: number
  email: string
  name: string
}

interface Report {
  id: number
  location: string
  wasteType: string
  amount: string
  createdAt: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface VerificationResult {
  wasteType: string
  quantity: string
  confidence: number
}

interface NewReport {
  location: string
  type: string
  amount: string
}

export default function ReportPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  const [reports, setReports] = useState<Report[]>([])

  const [newReport, setNewReport] = useState<NewReport>({
    location: '',
    type: '',
    amount: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure' | 'no_waste'>('idle')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewReport({ ...newReport, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const extractJsonFromText = (text: string): string => {
    const startIndex = text.indexOf('{')
    const endIndex = text.lastIndexOf('}')

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('No valid JSON object found in response')
    }

    return text.substring(startIndex, endIndex + 1)
  }

  const handleVerify = async () => {
    if (!file) return

    setVerificationStatus('verifying')

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const base64Data = await readFileAsBase64(file)

      const imageParts = [
        {
          inlineData: {
            data: base64Data.split(',')[1],
            mimeType: file.type,
          },
        },
      ]

      const prompt = `You are an expert in waste management and recycling. Analyze this image and determine if there is any waste present.
        If waste is detected, provide:
        1. The type of waste (e.g., plastic, paper, glass, metal, organic)
        2. An estimate of the quantity or amount (in kg or liters)
        3. Your confidence level in this assessment (as a percentage between 0 and 100)

        If no waste is detected, respond with: {"wasteType":"none","quantity":"0","confidence":100}

        Otherwise, respond with a JSON object in this exact format:
        {"wasteType":"type of waste","quantity":"estimated quantity with unit","confidence":percentage}`

      const result = await model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = response.text()

      try {
        const jsonStr = extractJsonFromText(text)
        const parsedResult = JSON.parse(jsonStr) as VerificationResult

        if (parsedResult.wasteType === "none") {
          setVerificationStatus('no_waste')
          setVerificationResult(null)
          toast.error('No waste detected in the image. Please upload an image containing waste.')
          return
        }

        if (!parsedResult.wasteType || !parsedResult.quantity || typeof parsedResult.confidence !== 'number') {
          throw new Error('Invalid response format')
        }

        setVerificationResult(parsedResult)
        setVerificationStatus('success')
        setNewReport(prev => ({
          ...prev,
          type: parsedResult.wasteType,
          amount: parsedResult.quantity
        }))
      } catch (error) {
        console.error('Failed to parse AI response:', text)
        setVerificationStatus('failure')
        toast.error('Failed to process AI response. Please try again.')
      }
    } catch (error) {
      console.error('Error verifying waste:', error)
      setVerificationStatus('failure')
      toast.error('Error during verification. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationStatus !== 'success' || !user) {
      toast.error(verificationStatus === 'no_waste'
        ? 'No waste detected in the image. Please upload a new image.'
        : 'Please verify the waste before submitting or log in.')
      return
    }

    setIsSubmitting(true)
    try {
      const report = await createReport(
        user.id,
        newReport.location,
        newReport.type,
        newReport.amount,
        preview || undefined,
        verificationResult ? JSON.stringify(verificationResult) : undefined
      )

      if (!report) {
        throw new Error('Failed to create report')
      }

      const formattedReport: Report = {
        id: report.id,
        location: report.location,
        wasteType: report.wasteType,
        amount: report.amount,
        createdAt: new Date(report.createdAt).toISOString().split('T')[0],
        status: report.status
      }

      setReports([formattedReport, ...reports])
      setNewReport({ location: '', type: '', amount: '' })
      setFile(null)
      setPreview(null)
      setVerificationStatus('idle')
      setVerificationResult(null)

      toast.success('Report submitted successfully! A collector will be assigned soon.')
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const checkUser = async () => {
      const email = localStorage.getItem('userEmail')
      if (email) {
        let user = await getUserByEmail(email)
        if (!user) {
          user = await createUser(email, 'Anonymous User')
        }
        setUser(user)

        const recentReports = await getRecentReports()
        if (recentReports) {
          const formattedReports = recentReports.map(report => ({
            id: report.id,
            location: report.location,
            wasteType: report.wasteType,
            amount: report.amount,
            createdAt: new Date(report.createdAt).toISOString().split('T')[0],
            status: report.status
          }))
          setReports(formattedReports)
        }
      } else {
        router.push('/login')
      }
    }
    checkUser()
  }, [router])

  const isSubmitDisabled = isSubmitting || verificationStatus !== 'success' || !user

  return (
    <div className="min-h-screen flex flex-col items-center bg-green-50">
      <header className="w-full py-6 bg-green-400 text-white text-center rounded-2xl animated-header">
        <h1 className="text-4xl font-bold">Report Waste</h1>
      </header>

      <main className="flex-grow p-8 w-full max-w-4xl">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg mb-12 form-container">
          <div className="mb-8">
            <label htmlFor="waste-image" className="block text-lg font-medium text-gray-700 mb-2">
              Upload Waste Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 animate-bounce" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="waste-image"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                  >
                    <span>Upload a file</span>
                    <input id="waste-image" name="waste-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          {preview && (
            <div className="mt-4 mb-8">
              <img src={preview} alt="Waste preview" className="max-w-full h-auto rounded-xl shadow-md transition-transform duration-300 hover:scale-105" />
            </div>
          )}

          <Button
            type="button"
            onClick={handleVerify}
            className="w-full mb-8 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-4 text-lg rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg transform hover:text-xl"
            disabled={!file || verificationStatus === 'verifying'}
            style={{ minHeight: '60px' }}
          >
            {verificationStatus === 'verifying' ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="h-7 w-7 text-white mr-3" />
                Verify Waste
              </>
            )}
          </Button>

          {verificationStatus === 'success' && verificationResult && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl slide-in">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
                <div>
                  <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Waste Type: {verificationResult.wasteType}</p>
                    <p>Quantity: {verificationResult.quantity}</p>
                    <p>Confidence: {verificationResult.confidence}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {verificationStatus === 'no_waste' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-xl shake">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  ⚠
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No waste detected in the image. Please upload an image containing waste to submit a report.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={newReport.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                placeholder="Enter waste location"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
              <input
                type="text"
                id="type"
                name="type"
                value={newReport.type}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
                placeholder="Verified waste type"
                readOnly
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Estimated Amount</label>
              <input
                type="text"
                id="amount"
                name="amount"
                value={newReport.amount}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
                placeholder="Verified amount"
                readOnly
              />
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full bg-gradient-to-r ${
              isSubmitDisabled
                ? 'from-gray-300 to-gray-500 cursor-not-allowed'
                : 'from-green-300 to-green-500 hover:from-green-400 hover:to-green-600'
            } text-white py-5 text-xl rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg transform hover:text-2xl`}
            disabled={isSubmitDisabled}
            style={{ minHeight: '60px' }}
          >
            {isSubmitting ? (
              <>
                <Loader className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                Submitting...
              </>
            ) : (
              <>
                <MapPin className="h-7 w-7 text-white mr-3" />
                Submit Report
              </>
            )}
          </Button>
        </form>

        <h2 className="text-3xl font-semibold mb-6 text-gray-800">Recent Reports</h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
                      {report.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.wasteType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdAt}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}