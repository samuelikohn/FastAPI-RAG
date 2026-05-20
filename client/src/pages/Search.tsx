import { useEffect, useState } from "react"

type SortColumn = "filename" | "upload_date"
type SortDir = "asc" | "desc"

interface DocumentRecord {
	document_id: string
	filename: string
	chunk_count: number
	upload_date: string
}

export default function SearchPage() {
	const [docs, setDocs] = useState<DocumentRecord[]>([])
	const [filter, setFilter] = useState("")
	const [sortCol, setSortCol] = useState<SortColumn>("upload_date")
	const [sortDir, setSortDir] = useState<SortDir>("desc")
	const [status, setStatus] = useState<"loading" | "error" | "ready">(
		"loading"
	)
	const [deleting, setDeleting] = useState<Set<string>>(new Set())
	const [confirming, setConfirming] = useState<string | null>(null)

	useEffect(() => {
		fetch("/api/v1/documents")
			.then((r) => {
				if (!r.ok) throw new Error()
				return r.json()
			})
			.then((data: DocumentRecord[]) => {
				setDocs(data)
				setStatus("ready")
			})
			.catch(() => setStatus("error"))
	}, [])

	const handleDelete = async (id: string) => {
		setConfirming(null)
		setDeleting((prev) => new Set(prev).add(id))
		try {
			const r = await fetch(`/api/v1/documents/${id}`, { method: "DELETE" })
			if (!r.ok) throw new Error()
			setDocs((prev) => prev.filter((d) => d.document_id !== id))
		} finally {
			setDeleting((prev) => {
				const next = new Set(prev)
				next.delete(id)
				return next
			})
		}
	}

	const handleSort = (col: SortColumn) => {
		if (col === sortCol) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"))
		} else {
			setSortCol(col)
			setSortDir("asc")
		}
	}

	const visible = docs
		.filter((d) => d.filename.toLowerCase().includes(filter.toLowerCase()))
		.sort((a, b) => {
			const cmp = a[sortCol].localeCompare(b[sortCol])
			return sortDir === "asc" ? cmp : -cmp
		})

	return (
		<div className="min-h-full bg-gray-50 p-6">
			<div className="max-w-4xl mx-auto">
				<div className="flex items-center justify-between mb-6 gap-4">
					<h1 className="text-2xl font-semibold text-gray-800 shrink-0">
						Documents
					</h1>
					<input
						type="text"
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
						placeholder="Search by filename…"
						className="w-72 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
					/>
				</div>

				{status === "loading" && (
					<div className="flex justify-center py-16">
						<div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin" />
					</div>
				)}

				{status === "error" && (
					<div className="flex justify-center py-16">
						<p className="text-red-600 text-sm">
							Failed to load documents. Please try again.
						</p>
					</div>
				)}

				{status === "ready" && (
					<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
						<table className="w-full">
							<thead>
								<tr className="bg-gray-50">
									<SortHeader
										label="Filename"
										col="filename"
										active={sortCol === "filename"}
										dir={sortDir}
										onSort={handleSort}
									/>
									<SortHeader
										label="Upload Date"
										col="upload_date"
										active={sortCol === "upload_date"}
										dir={sortDir}
										onSort={handleSort}
									/>
									<th className="px-6 py-3" />
								</tr>
							</thead>
							<tbody>
								{docs.length === 0 && (
									<tr>
										<td
											colSpan={3}
											className="px-6 py-12 text-center text-sm text-gray-400"
										>
											No documents uploaded yet.
										</td>
									</tr>
								)}
								{docs.length > 0 && visible.length === 0 && (
									<tr>
										<td
											colSpan={3}
											className="px-6 py-12 text-center text-sm text-gray-400"
										>
											No documents match your search.
										</td>
									</tr>
								)}
								{visible.map((doc) => (
									<tr
										key={doc.document_id}
										className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
									>
										<td className="px-6 py-4 text-sm text-gray-800">
											{doc.filename}
										</td>
										<td className="px-6 py-4 text-sm text-gray-800">
											{doc.upload_date}
										</td>
										<td className="px-6 py-4 text-right">
											{deleting.has(doc.document_id) ? (
												<span className="text-xs text-gray-400">
													Deleting…
												</span>
											) : confirming === doc.document_id ? (
												<div className="flex items-center justify-end gap-3">
													<span className="text-xs text-gray-500">
														Delete this document?
													</span>
													<button
														onClick={() =>
															void handleDelete(
																doc.document_id
															)
														}
														className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
													>
														Confirm
													</button>
													<button
														onClick={() =>
															setConfirming(null)
														}
														className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
													>
														Cancel
													</button>
												</div>
											) : (
												<button
													onClick={() =>
														setConfirming(
															doc.document_id
														)
													}
													className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
												>
													Delete
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)
}

interface SortHeaderProps {
	label: string
	col: SortColumn
	active: boolean
	dir: SortDir
	onSort: (col: SortColumn) => void
}

function SortHeader({ label, col, active, dir, onSort }: SortHeaderProps) {
	return (
		<th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
			<button
				onClick={() => onSort(col)}
				className="flex items-center gap-1.5 hover:text-gray-800 transition-colors cursor-pointer"
			>
				{label}
				{active ? (
					<svg
						className={`w-3.5 h-3.5 text-blue-500 transition-transform ${dir === "asc" ? "rotate-180" : ""}`}
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2.5}
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M19.5 8.25l-7.5 7.5-7.5-7.5"
						/>
					</svg>
				) : (
					<svg
						className="w-3.5 h-3.5 text-gray-300"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2.5}
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
						/>
					</svg>
				)}
			</button>
		</th>
	)
}
