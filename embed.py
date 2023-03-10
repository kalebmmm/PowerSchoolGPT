import pandas as pd
import numpy as np
import openai
import time

openai.api_key = 'your-api-key-here'

def get_embedding(text, model="text-embedding-ada-002"):
   text = text.replace("\n", " ")
   print('getting embedding')

   while(True):
      try:
         return openai.Embedding.create(input = [text], model=model)['data'][0]['embedding']
      except:
         print('failed')
         time.sleep(10)
      

 
df = pd.read_csv('Output.csv', names=['text'])
df['embedding'] = df.text.apply(lambda x: get_embedding(x, model='text-embedding-ada-002'))

df.to_csv('embedded.csv')

print(df)