import { useEffect, useRef, useState } from "react"

interface Source {
	content: string
	metadata: Record<string, unknown>
}

interface Message {
	role: "user" | "assistant"
	text: string
	sources?: Source[]
	isError?: boolean
}

interface QueryResponse {
	answer: string
	sources: Source[]
}

export default function ChatPage() {
	const [messages, setMessages] = useState<Message[]>([])
	const [input, setInput] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const [openSources, setOpenSources] = useState<Record<number, Set<number>>>({})
	const bottomRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages, isLoading])

	const sendMessage = async () => {
		const question = input.trim()
		if (!question || isLoading) return

		setMessages((prev) => [...prev, { role: "user", text: question }])
		setInput("")
		setIsLoading(true)

		try {
			const response = await fetch("/api/v1/query", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ question })
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error((data.detail as string) ?? "Query failed")
			}

			const data = (await response.json()) as QueryResponse
			setMessages((prev) => [
				...prev,
				{ role: "assistant", text: data.answer, sources: data.sources }
			])
		} catch {
			setMessages((prev) => [
				...prev,
				{
					role: "assistant",
					text: "Something went wrong. Please try again.",
					isError: true
				}
			])
		} finally {
			setIsLoading(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			void sendMessage()
		}
	}

	const toggleSource = (msgIndex: number, srcIndex: number) => {
		setOpenSources((prev) => {
			const current = new Set(prev[msgIndex] ?? [])
			if (current.has(srcIndex)) {
				current.delete(srcIndex)
			} else {
				current.add(srcIndex)
			}
			return { ...prev, [msgIndex]: current }
		})
	}

	return (
		<div className="flex flex-col h-screen bg-gray-50">
			<header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
				<h1 className="text-xl font-semibold text-gray-800">Chat</h1>
			</header>

			<div className="flex-1 overflow-y-auto px-4 py-6">
				<div className="max-w-3xl mx-auto flex flex-col gap-4">
					{messages.length === 0 && !isLoading && (
						<p className="text-center text-gray-400 text-sm mt-16">
							Ask a question about your uploaded documents.
						</p>
					)}

					{messages.map((msg, msgIndex) => (
						<div
							key={msgIndex}
							className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
						>
							{msg.role === "user" ? (
								<div className="max-w-[75%] bg-blue-500 text-white rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap">
									{msg.text}
								</div>
							) : (
								<div className="max-w-[75%] bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 text-sm">
									<p
										className={`whitespace-pre-wrap ${msg.isError ? "text-red-600" : "text-gray-800"}`}
									>
										{msg.text}
									</p>

									{msg.sources && msg.sources.length > 0 && (
										<div className="mt-3 pt-3 border-t border-gray-100">
											<p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
												Sources
											</p>
											<div className="flex flex-col gap-1">
												{msg.sources.map((src, srcIndex) => {
													const isOpen =
														openSources[msgIndex]?.has(srcIndex) ?? false
													const filename =
														typeof src.metadata.filename === "string"
															? src.metadata.filename
															: "Source"

													return (
														<div key={srcIndex}>
															<button
																onClick={() => toggleSource(msgIndex, srcIndex)}
																className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-medium cursor-pointer transition-colors"
															>
																<svg
																	className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	strokeWidth={2.5}
																	stroke="currentColor"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		d="m8.25 4.5 7.5 7.5-7.5 7.5"
																	/>
																</svg>
																{filename}
															</button>
															{isOpen && (
																<div className="mt-1.5 ml-4 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
																	{src.content}
																</div>
															)}
														</div>
													)
												})}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					))}

					{isLoading && (
						<div className="flex justify-start">
							<div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-1.5">
								<div
									className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
									style={{ animationDelay: "0ms" }}
								/>
								<div
									className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
									style={{ animationDelay: "150ms" }}
								/>
								<div
									className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
									style={{ animationDelay: "300ms" }}
								/>
							</div>
						</div>
					)}

					<div ref={bottomRef} />
				</div>
			</div>

			<footer className="bg-white border-t border-gray-200 px-4 py-4 shrink-0">
				<div className="max-w-3xl mx-auto flex items-end gap-3">
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Ask a question… (Enter to send, Shift+Enter for newline)"
						rows={1}
						className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
					/>
					<button
						onClick={() => void sendMessage()}
						disabled={isLoading || !input.trim()}
						className="shrink-0 px-4 py-3 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
					>
						Send
					</button>
				</div>
			</footer>
		</div>
	)
}
