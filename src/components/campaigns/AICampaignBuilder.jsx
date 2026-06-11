import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Wand2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AICampaignBuilder({ restaurant, customers, onCampaignGenerated, onSkip }) {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCampaign = async () => {
    if (!goal.trim()) {
      toast.error('Please describe your campaign goal');
      return;
    }

    setLoading(true);
    try {
      const prompt = `You are a marketing expert for fine dining restaurants.

Restaurant: ${restaurant?.name || 'A fine dining restaurant'}
Total Customers: ${customers.length}
Campaign Goal: ${goal}

Generate a complete marketing campaign in JSON format:

1. name: A catchy campaign name (max 50 chars)
2. content: Compelling message for the campaign (suitable for SMS/WhatsApp/Email, max 300 chars, include emojis where appropriate)
3. email_subject: Email subject line if this would work well as email
4. channel: Recommended channel ("sms", "whatsapp", or "email") based on the goal
5. recipient_type: "all" (send to everyone) or "selected" (if goal mentions specific customer segment)
6. suggested_timing: Object with { day: "Monday/Tuesday/etc", time: "HH:MM AM/PM", reason: "why this timing" }

Make it professional, elegant, and suitable for a premium restaurant brand.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            content: { type: "string" },
            email_subject: { type: "string" },
            channel: { type: "string" },
            recipient_type: { type: "string" },
            suggested_timing: {
              type: "object",
              properties: {
                day: { type: "string" },
                time: { type: "string" },
                reason: { type: "string" }
              }
            }
          }
        }
      });

      // Calculate recipient count based on type
      const recipientCount = result.recipient_type === 'all' 
        ? customers.length 
        : Math.floor(customers.length * 0.3); // Assume 30% for targeted

      const campaignData = {
        name: result.name,
        content: result.content,
        email_subject: result.email_subject,
        channel: result.channel,
        recipient_type: result.recipient_type,
        recipient_ids: result.recipient_type === 'all' ? [] : customers.slice(0, Math.floor(customers.length * 0.3)).map(c => c.id),
        recipient_count: recipientCount,
        status: 'draft',
        scheduled_date: '',
        ai_metadata: {
          original_goal: goal,
          suggested_timing: result.suggested_timing
        }
      };

      onCampaignGenerated(campaignData);
      toast.success('Campaign generated! Review and customize as needed.');
    } catch (error) {
      toast.error('Failed to generate campaign');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "Promote our new tasting menu launching next weekend",
    "Invite VIP customers to our wine pairing event this Friday",
    "Announce our holiday menu for December celebrations",
    "Remind customers about our lunch special this week"
  ];

  return (
    <div className="space-y-4">
      <Card className="border-[#C5A059]/30 bg-gradient-to-br from-amber-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-[#C5A059]" />
            <CardTitle>AI Campaign Builder</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Describe what you want to promote, and AI will create a complete campaign for you.
            </p>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="E.g., Promote our new tasting menu launching next weekend..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-500">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setGoal(example)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateCampaign}
              disabled={loading || !goal.trim()}
              className="flex-1 bg-[#C5A059] hover:bg-[#B8934D] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Campaign
                </>
              )}
            </Button>
            <Button
              onClick={onSkip}
              variant="outline"
              disabled={loading}
            >
              Create Manually
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">What AI Will Generate</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Campaign name and compelling content</li>
              <li>• Best channel recommendation (SMS/WhatsApp/Email)</li>
              <li>• Target audience suggestion</li>
              <li>• Optimal timing recommendation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}