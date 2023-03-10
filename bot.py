import pandas as pd
import numpy as np
import openai
from openai.embeddings_utils import get_embedding, cosine_similarity

openai.api_key = 'your-api-key-here'

if __name__ == '__main__':
    corpus = pd.read_csv('embedded.csv')
    corpus['embedding'] = corpus['embedding'].apply(lambda x: np.array(eval(x)), 0)

    while(True):
        query = input('Enter Your Question: ')
        embed = get_embedding(query, 'text-embedding-ada-002')
        corpus['similarities'] = corpus.embedding.apply(lambda x: cosine_similarity(x, embed))
        res = corpus.sort_values('similarities', ascending=False).head(2)
        context = 'Documentation:\n' + '\n'.join(res['text'].values.tolist())
        completion = openai.ChatCompletion.create(model='gpt-3.5-turbo', messages=[
            {
                "role": "system",
                "content": "You are PowerSchoolGPT. I will attempt to provide relevant sections of PowerSchool documentation, and then I will ask a question about it. If the documentation does not explicitly answer the question, say \"Sorry, I don't know\" and nothing else. Pretend I do not have access to the PowerSchool documentation, so I am relying on you for answers."
            },
            {
                "role": "user",
                "content": context
            },
            {
                "role": "user",
                "content": "Question: " + query
            },
        ])

        print(completion['choices'][0]['message']['content'])
        print('\n')
