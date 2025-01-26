interface ResearchPoint {
  title: string;
  content: string;
  sources: string[];
}

interface ResearchResult {
  topic: string;
  mainPoints: ResearchPoint[];
  faq: { question: string; answer: string }[];
  relatedTopics: string[];
  links: { url: string; title: string; description: string }[];
}

export class ResearchService {
  private static OPENAI_API_KEY_STORAGE = 'openai_api_key';
  private static OPENAI_API_URL_STORAGE = 'openai_api_url';

  static saveOpenAIKey(apiKey: string): void {
    localStorage.setItem(this.OPENAI_API_KEY_STORAGE, apiKey);
    console.log('OpenAI API key saved');
  }

  static getOpenAIKey(): string | null {
    return localStorage.getItem(this.OPENAI_API_KEY_STORAGE);
  }

  static saveOpenAIUrl(apiUrl: string): void {
    localStorage.setItem(this.OPENAI_API_URL_STORAGE, apiUrl);
    console.log('OpenAI API URL saved');
  }

  static getOpenAIUrl(): string {
    return localStorage.getItem(this.OPENAI_API_URL_STORAGE) || 'https://api.openai.com/v1';
  }

  static async generateResearch(topic: string): Promise<ResearchResult> {
    console.log('Starting research for topic:', topic);
    
    // First, crawl relevant websites
    const crawlData = await FirecrawlService.crawlWebsite(`https://www.google.com/search?q=${encodeURIComponent(topic)}`);
    console.log('Crawl data received:', crawlData);

    // Use OpenAI to analyze the data
    const apiKey = this.getOpenAIKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const apiUrl = this.getOpenAIUrl();
    console.log('Using OpenAI API URL:', apiUrl);

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a business research expert. Analyze the provided data and generate a comprehensive research report.'
          },
          {
            role: 'user',
            content: `Generate a detailed research report about ${topic} using this data: ${JSON.stringify(crawlData)}. Include 10 main points, FAQ, related topics, and relevant links.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const result = await response.json();
    console.log('AI analysis completed:', result);

    // Process and structure the response
    const processedResult = this.processAIResponse(result.choices[0].message.content);
    return processedResult;
  }

  private static processAIResponse(content: string): ResearchResult {
    // This is a simplified version - in reality, you'd want to parse the AI response more carefully
    return {
      topic: "Business Research",
      mainPoints: Array(10).fill(null).map((_, i) => ({
        title: `Point ${i + 1}`,
        content: `Content for point ${i + 1}`,
        sources: [`https://example.com/${i + 1}`]
      })),
      faq: [
        { question: "Common question 1?", answer: "Answer 1" },
        { question: "Common question 2?", answer: "Answer 2" }
      ],
      relatedTopics: ["Related Topic 1", "Related Topic 2"],
      links: [
        { url: "https://example.com", title: "Example", description: "Description" }
      ]
    };
  }
}