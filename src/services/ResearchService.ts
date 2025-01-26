import { FirecrawlService } from '@/utils/FirecrawlService';

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
  private static OPENAI_MODEL_STORAGE = 'openai_model';

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

  static saveOpenAIModel(model: string): void {
    localStorage.setItem(this.OPENAI_MODEL_STORAGE, model);
    console.log('OpenAI model saved:', model);
  }

  static getOpenAIModel(): string {
    return localStorage.getItem(this.OPENAI_MODEL_STORAGE) || 'deepseek-reasoner';
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
    const model = this.getOpenAIModel();
    console.log('Using OpenAI API URL:', apiUrl);
    console.log('Using model:', model);

    const systemPrompt = `You are a business research expert. Analyze the provided data and generate a comprehensive research report with the following structure:
    1. Main Points: Extract 10 key insights, each with a title, detailed content, and relevant source URLs
    2. FAQ: Generate relevant questions and answers based on the data
    3. Related Topics: Suggest related research topics
    4. Useful Links: Provide relevant links with titles and descriptions
    
    Format your response as a JSON object with these exact keys: mainPoints (array of {title, content, sources}), faq (array of {question, answer}), relatedTopics (array of strings), links (array of {url, title, description})`;

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate a detailed research report about ${topic} using this data: ${JSON.stringify(crawlData)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const result = await response.json();
    console.log('AI analysis completed:', result);

    try {
      const content = JSON.parse(result.choices[0].message.content);
      return {
        topic,
        mainPoints: content.mainPoints || [],
        faq: content.faq || [],
        relatedTopics: content.relatedTopics || [],
        links: content.links || []
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }
}