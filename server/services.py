import os
from functools import lru_cache
from astrapy import DataAPIClient
from astrapy.collection import Collection
from langchain_astradb import AstraDBVectorStore
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings


@lru_cache
def get_vector_store() -> AstraDBVectorStore:
    embeddings = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001")
    return AstraDBVectorStore(
        embedding=embeddings,
        collection_name=os.environ["ASTRA_DB_COLLECTION"],
        api_endpoint=os.environ["ASTRA_DB_API_ENDPOINT"],
        token=os.environ["ASTRA_DB_APPLICATION_TOKEN"],
    )


@lru_cache
def get_collection() -> Collection:
    client = DataAPIClient(os.environ["ASTRA_DB_APPLICATION_TOKEN"])
    db = client.get_database(os.environ["ASTRA_DB_API_ENDPOINT"])
    return db.get_collection(os.environ["ASTRA_DB_COLLECTION"])


@lru_cache
def get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(model="gemini-flash-latest")
