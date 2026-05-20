from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from models.query import QueryRequest, QueryResponse, Source
from services import get_llm, get_vector_store


PROMPT_TEMPLATE = """
Answer the question based on the following context.
If the context does not contain enough information to answer, say so.

Context:
{context}

Question:
{question}
"""


async def query_handler(query: QueryRequest) -> QueryResponse:
    vector_store = get_vector_store()
    llm = get_llm()

    results = await vector_store.asimilarity_search(query.question, k=4)

    context = "\n\n".join(doc.page_content for doc in results)

    prompt = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    chain = prompt | llm | StrOutputParser()
    answer = await chain.ainvoke({"context": context, "question": query.question})

    sources = [
        Source(content=doc.page_content, metadata=doc.metadata) for doc in results
    ]

    return QueryResponse(answer=answer, sources=sources)
