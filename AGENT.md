# Description 
- This is Nextjs 16 and the whole project is on a advance chatbot like ChatGPT, Claude, etc.. 

# File struacture
- The UI is in the app/chats/* and they are well separated into components with all logics are to be found in useChat.ts
- The backend is at app/api/chat/route.ts which is where the all the calls are happening
- I am using Gemini SDK with Tavily to do integrate AI and web search and all related files and configs are at lib/ai/* and lib/ai/search/*. Importantly all the files are well named as finding the functions are quick

# Additional points
- When adding code make sure that it fits to its surrounding code. Meaning added code shouldn't break other part of the code unless asked
- If my decisions are poor then you may give suggestions while not implementing it immediately unless asked
