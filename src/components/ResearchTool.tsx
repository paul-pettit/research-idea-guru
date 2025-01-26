import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { ResearchService } from '@/services/ResearchService';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const ResearchTool = () => {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [showApiKeyInputs, setShowApiKeyInputs] = useState(true);
  const [firecrawlKey, setFirecrawlKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiUrl, setOpenaiUrl] = useState('https://api.openai.com/v1');
  const [openaiModel, setOpenaiModel] = useState('deepseek-reasoner');

  const handleApiKeySave = () => {
    if (firecrawlKey) FirecrawlService.saveApiKey(firecrawlKey);
    if (openaiKey) ResearchService.saveOpenAIKey(openaiKey);
    if (openaiUrl) ResearchService.saveOpenAIUrl(openaiUrl);
    if (openaiModel) ResearchService.saveOpenAIModel(openaiModel);
    setShowApiKeyInputs(false);
    toast({
      title: "API Keys Saved",
      description: "Your API keys and settings have been saved successfully",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    
    try {
      // Validate API keys
      if (!FirecrawlService.getApiKey() || !ResearchService.getOpenAIKey()) {
        setShowApiKeyInputs(true);
        throw new Error('API keys are required');
      }

      // Start research process
      setProgress(20);
      console.log('Starting research for:', topic);
      const result = await ResearchService.generateResearch(topic);
      
      setProgress(100);
      setResearchResult(result);
      toast({
        title: "Research Complete",
        description: "Your research report has been generated successfully",
      });
    } catch (error) {
      console.error('Research error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate research",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Business Research Assistant</h1>
        <p className="text-lg text-gray-600">Enter a topic to generate comprehensive research</p>
      </div>

      {showApiKeyInputs && (
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">API Keys Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Firecrawl API Key</label>
              <Input
                type="password"
                value={firecrawlKey}
                onChange={(e) => setFirecrawlKey(e.target.value)}
                placeholder="Enter Firecrawl API key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
              <Input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="Enter OpenAI API key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OpenAI API URL</label>
              <Input
                type="url"
                value={openaiUrl}
                onChange={(e) => setOpenaiUrl(e.target.value)}
                placeholder="Enter OpenAI API URL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OpenAI Model</label>
              <Input
                type="text"
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                placeholder="Enter OpenAI model name"
              />
            </div>
            <Button onClick={handleApiKeySave} className="w-full">
              Save API Keys
            </Button>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter your research topic..."
            className="flex-1"
            required
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Researching..." : "Research"}
          </Button>
        </div>
        {isLoading && <Progress value={progress} className="w-full" />}
      </form>

      {researchResult && (
        <div className="space-y-8 animate-fade-in">
          <section>
            <h2 className="text-2xl font-bold mb-4">Key Points</h2>
            <div className="grid gap-4">
              {researchResult.mainPoints.map((point: any, index: number) => (
                <Card key={index} className="research-card">
                  <h3 className="font-semibold text-lg mb-2">{point.title}</h3>
                  <p className="text-gray-600">{point.content}</p>
                  <div className="mt-2 text-sm text-accent">
                    {point.sources.map((source: string, i: number) => (
                      <a key={i} href={source} target="_blank" rel="noopener noreferrer" className="mr-2">
                        [Source {i + 1}]
                      </a>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">FAQ</h2>
            <Accordion type="single" collapsible>
              {researchResult.faq.map((item: any, index: number) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Related Topics</h2>
            <div className="flex flex-wrap gap-2">
              {researchResult.relatedTopics.map((topic: string, index: number) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => setTopic(topic)}
                  className="hover:bg-accent/10"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Useful Links</h2>
            <div className="grid gap-4">
              {researchResult.links.map((link: any, index: number) => (
                <Card key={index} className="research-card">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:text-accent"
                  >
                    <h3 className="font-semibold">{link.title}</h3>
                    <p className="text-sm text-gray-600">{link.description}</p>
                  </a>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};