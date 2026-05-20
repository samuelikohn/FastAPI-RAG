import { useRef, useState } from "react"

type UploadStatus = "idle" | "loading" | "success" | "error"

interface UploadResult {
	document_id: string
	filename: string
	chunk_count: number
	upload_date: string
}

export default function UploadPage() {
	const [status, setStatus] = useState<UploadStatus>("idle")
	const [result, setResult] = useState<UploadResult | null>(null)
	const [error, setError] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const reset = () => {
		setStatus("idle")
		setResult(null)
		setError(null)
		if (inputRef.current) {
			inputRef.current.value = ""
		}
	}

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setStatus("loading")
		setError(null)

		const formData = new FormData()
		formData.append("file", file)

		try {
			const response = await fetch("/api/v1/upload", {
				method: "POST",
				body: formData
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error((data.detail as string) ?? "Upload failed")
			}

			const data = (await response.json()) as UploadResult
			setResult(data)
			setStatus("success")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed")
			setStatus("error")
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<h1 className="text-2xl font-semibold text-gray-800 text-center mb-6">
					Upload Document
				</h1>

				{status === "idle" && (
					<div
						onClick={() => inputRef.current?.click()}
						className="border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors duration-150"
					>
						<svg
							className="w-12 h-12 text-gray-400"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
							/>
						</svg>
						<p className="text-base font-medium text-gray-600">Click to upload</p>
						<p className="text-sm text-gray-400">PDF, TXT or MD</p>
						<input
							ref={inputRef}
							type="file"
							accept=".pdf,.txt,.md"
							className="hidden"
							onChange={handleFileChange}
						/>
					</div>
				)}

				{status === "loading" && (
					<div className="border-2 border-dashed border-blue-200 rounded-2xl p-12 flex flex-col items-center gap-4">
						<div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
						<p className="text-base font-medium text-gray-600">Uploading…</p>
					</div>
				)}

				{status === "success" && result && (
					<div className="border-2 border-green-200 bg-green-50 rounded-2xl p-12 flex flex-col items-center gap-3">
						<svg
							className="w-12 h-12 text-green-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
							/>
						</svg>
						<p className="text-lg font-semibold text-gray-800">{result.filename}</p>
						<p className="text-sm text-gray-500">
							{result.chunk_count} chunks · {result.upload_date}
						</p>
						<button
							onClick={reset}
							className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer"
						>
							Upload another
						</button>
					</div>
				)}

				{status === "error" && (
					<div className="border-2 border-red-200 bg-red-50 rounded-2xl p-12 flex flex-col items-center gap-3">
						<svg
							className="w-12 h-12 text-red-500"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
							/>
						</svg>
						<p className="text-base font-medium text-red-700">{error}</p>
						<button
							onClick={reset}
							className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
						>
							Try again
						</button>
					</div>
				)}
			</div>
		</div>
	)
}
