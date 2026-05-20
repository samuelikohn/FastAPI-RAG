import { NavLink } from "react-router-dom"

export default function NavBar() {
	return (
		<nav className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0">
			<span className="text-base font-semibold text-gray-800">
				RAG App
			</span>
			<div className="flex items-center gap-6 text-sm">
				{(
					[
						{ to: "/upload", label: "Upload" },
						{ to: "/chat", label: "Chat" },
						{ to: "/search", label: "Search" }
					] as const
				).map(({ to, label }) => (
					<NavLink
						key={to}
						to={to}
						className={({ isActive }) =>
							isActive
								? "text-blue-600 font-medium"
								: "text-gray-500 hover:text-gray-800 transition-colors"
						}
					>
						{label}
					</NavLink>
				))}
			</div>
		</nav>
	)
}
