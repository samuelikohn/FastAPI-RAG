# Code Review

Reviewed by Rachel Liu on May 23, 2026

[Repository](https://github.com/samuelikohn/FastAPI-RAG)

[Commit reviewed](https://github.com/samuelikohn/FastAPI-RAG/commit/49018e05ab4ae22ce3b72c6c8e27f53faf97f20b)

---

## Review Questions & Responses

1. AstraDB integration: There's the functions get_vector_store, get_collection, and get_llm defined in services.py, and how those functions are used by the document, upload, and query controllers. The specific issues I have in mind:
    - I'm using langchain-astra for accessing the vector store and astrapy for accessing the collection. For the purposes of querying documents in the collection, is there a way to access the collection through the langchain adapter that I overlooked?

        > I think you can also access the collection through langchain-astra like this:
        ```python
        from langchain_astradb import AstraDBLoader

        loader = AstraDBLoader(
            collection_name="my_collection",
            api_endpoint="YOUR_API_ENDPOINT",
            token="YOUR_TOKEN"
        )
        documents = loader.load()
        ```
        > And isn’t the AstraDBVectorStore also based on the specific collection specified in the arguments? Did you not use it because it didn’t have the metadata you need in controllers/documents.py?

    - By using astrapy over the langchain adapter is there any functionality that's being left out?

        > From what I can tell, it seems like the two have similar functionality, and if anything, astrapy is more low-level compared to the langchain, so it would have more functionality, not less?

2. Review the tests
    - Are they comprehensive?
    - Some tests have several asserts, should those be broken up?
    - I don't have any tests for the client, are they necessary?

        > The tests seem fairly comprehensive to me. I think it would be nice to test the query with some “trick questions” to see whether or not it would be able to sufficiently answer questions with jargon, domain specific knowledge, other languages, etc, but this is a nice to have. The asserts are fine. I would just space them out with extra newlines

3. Flag anything that's unclear in the README, I'd like someone without knowledge of the project to lmk if there's any key information missing.

    > I thought the readme was very clear. I was able to get setup using your .rar file and run my own txt file through the server with the help of the readme.

## Discussion

Coming from a JS background, I was trying to translate the way I used the LangChain/AstraDB libraries to FastAPI. Using `AstraDBVectorStore` by itself wasn't good enough in this case, there's no way to access the underlying collection. From the documentation the only way I could tell to access the underlying collection was to use `astrapy`. Getting another pair of eyes on it was useful because it turns out there is a way to access the vector store, via `AstraDBLoader`. Whether this object supports searching, filtering, and deleting documents from the collection is something to look into.

The other issue I was curious about is whether accessing the collection through `astrapy` was missing any functionality, as this is a lower level library that doesn't invoke LangChain in any way. If the collection is accessed outside of the LangChain scope, is there any information about the chunking or embedding that's dropped? Rachel didn't seem to think so, because `astrapy` works on a lower level. While you certainly could replicate the same functionality given the right tools, the time required might not be worth it. I guess my question would've been better phrased as, "Is there a difference in functionality depending on which library is used to access the collection?"

The tests I have are focused on the logical processing of data. I use mocks for all of the external services so that thes tests don't have to rely on them. At least that's my understanding of the philosophy behind unit tests. Testing the LLM system prompt with trick questions sounds like a good idea, I'm not sure if adding a test for that is the right way to go about it. For this project, manual testing works well enough. That's something to look into in the future, conventions for testing external systems, especially when there's an element of randomness.

For the tests, I made a separate function for each feature I wanted to test, but the tests aren't necessarily atomic. For example, in `tests/test_documents.test_get_document_success()`, there's several asserts related to making sure the `documents/{document_id}` route works. However, I'm also using that function to test whether document chunks are returned sorted. Arguably those are separate issues and could be broken up into different tests, but Rachel thought the tests are fine as-is so I won't change anything.

## Changes Made

To be candid, I was late sending the project off for review, so after receiving the feedback, there wasn't a lot of time to implement any changes. Additionally, the project works as-is, all features I scoped out are implemented. Because of this, I don't want to rush at the end of the project, changing up how the core logic works, for no new functionality. With enough time, I'd like to make a new branch and try to use `AstraDBLoader` to see if can get my API to work the same way. From what I can tell from the documentation, this is exactly what I'm looking for in terms of searching documents. There doesn't look to be a method for deleting documents, so that may have to be done through `AstraDBVectorStore`.