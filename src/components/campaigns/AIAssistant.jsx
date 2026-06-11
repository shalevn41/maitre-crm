import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Lightbulb, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AIAssistant({ restaurant, formData, customers, onApplySuggestion }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const prompt = `You are a marketing expert for fine dining restaurants. 

Restaurant: ${restaurant?.name || 'A fine dining restaurant'}
Campaign Type: ${formData.name || 'Marketing campaign'}
Channel: ${formData.channel}
Current Message: ${formData.content || 'Not written yet'}
Number of Recipients: ${formData.recipient_type === 'all' ? customers.length : formData.recipient_ids?.length || 0}

Provide marketing suggestions in JSON format:

1. content_suggestions: 3 different message variations (keep them concise, engaging, and suitable for ${formData.channel})
2. channel_recommendation: Recommend the best channel (SMS/WhatsApp/Email) with reasoning
3. timing_recommendation: Best time to send (e.g., "Tuesday 6:00 PM" or "Friday 11:00 AM") with reasoning
4. improvements: 2-3 specific tips to improve engagement

Make suggestions elegant, professional, and suitable for a premium restaurant brand.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            content_suggestions: {
              type: "array",
              items: { 
                type: "object",
                properties: {
                  text: { type: "string" },
                  tone: { type: "string" }
                }
              }
            },
            channel_recommendation: {
              type: "object",
              properties: {
                channel: { type: "string" },
                reason: { type: "string" }
              }
            },
            timing_recommendation: {
              type: "object",
              properties: {
                time: { type: "string" },
                reason: { type: "string" }
              }
            },
            improvements: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setSuggestions(result);
    } catch (error) {
      toast.error('Failed to generate suggestions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-[#C5A059]/30 bg-gradient-to-br from-amber-50/50 to-white">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            <h3 className="font-semibold text-[#0F172A]">AI Assistant</h3>
          </div>
          <Button
            onClick={generateSuggestions}
            disabled={loading}
            size="sm"
            className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI Suggestions
              </>
            )}
          </Button>
        </div>

        {!suggestions && !loading && (
          <p className="text-sm text-gray-600">
            Get AI-powered suggestions for your campaign content, channel selection, and optimal timing.
          </p>
        )}

        {suggestions && (
          <div className="space-y-4">
            {/* Content Suggestions */}
            {suggestions.content_suggestions?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-[#C5A059]" />
                  <h4 className="text-sm font-medium text-[#0F172A]">Message Ideas</h4>
                </div>
                <div className="space-y-2">
                  {suggestions.content_suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => onApplySuggestion({ content: suggestion.text })}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.tone}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{suggestion.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Channel Recommendation */}
            {suggestions.channel_recommendation && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Recommended Channel: {suggestions.channel_recommendation.channel?.toUpperCase()}
                    </p>
                    <p className="text-xs text-blue-700">
                      {suggestions.channel_recommendation.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timing Recommendation */}
            {suggestions.timing_recommendation && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-900 mb-1">
                      Best Time: {suggestions.timing_recommendation.time}
                    </p>
                    <p className="text-xs text-purple-700">
                      {suggestions.timing_recommendation.reason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Improvement Tips */}
            {suggestions.improvements?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[#0F172A] mb-2">💡 Tips to Improve</h4>
                <ul className="space-y-1.5">
                  {suggestions.improvements.map((tip, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="text-[#C5A059] font-bold mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}