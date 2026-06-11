import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Sparkles, Save, Eye, Plus, Trash2, Image as ImageIcon,
  Type, Gift, Layout, Palette, RefreshCw, Loader2, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import { createPageUrl } from '@/utils';

export default function LandingPageBuilder() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    fetchUser();
  }, []);

  const { data: restaurant } = useQuery({
    queryKey: ['restaurant', user?.restaurant_id],
    queryFn: async () => {
      if (!user?.restaurant_id) return null;
      const restaurants = await base44.entities.Restaurant.filter({ id: user.restaurant_id });
      return restaurants[0];
    },
    enabled: !!user?.restaurant_id,
  });

  // Load saved design
  useEffect(() => {
    if (restaurant?.landing_page_design) {
      try {
        setBlocks(JSON.parse(restaurant.landing_page_design));
      } catch (e) {
        setBlocks(getDefaultBlocks());
      }
    } else {
      setBlocks(getDefaultBlocks());
    }
  }, [restaurant]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Restaurant.update(restaurant.id, {
        landing_page_design: JSON.stringify(blocks)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurant']);
      toast.success('דף הנחיתה נשמר בהצלחה!');
    },
  });

  function getDefaultBlocks() {
    return [
      {
        id: 'hero',
        type: 'hero',
        content: {
          title: 'הצטרפו למועדון האקסקלוסיבי',
          subtitle: 'תהנו מהטבות ייחודיות ומתנות מפנקות',
          backgroundImage: '',
        }
      },
      {
        id: 'gift',
        type: 'gift',
        content: {
          title: 'מתנת הצטרפות',
          description: 'קבלו מתנה מיוחדת בביקור הראשון',
        }
      },
      {
        id: 'form',
        type: 'form',
        content: {
          title: 'הרשמו עכשיו',
        }
      }
    ];
  }

  const blockTypes = [
    { type: 'hero', label: 'כותרת ראשית', icon: Layout },
    { type: 'text', label: 'טקסט', icon: Type },
    { type: 'image', label: 'תמונה', icon: ImageIcon },
    { type: 'gift', label: 'מתנת הצטרפות', icon: Gift },
    { type: 'form', label: 'טופס הרשמה', icon: Layout },
  ];

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items);
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type,
      content: getDefaultContent(type)
    };
    setBlocks([...blocks, newBlock]);
    setShowAddDialog(false);
  };

  const deleteBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (selectedBlock?.id === id) setSelectedBlock(null);
  };

  const updateBlock = (id, content) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
  };

  function getDefaultContent(type) {
    switch (type) {
      case 'hero':
        return { title: 'כותרת מרכזית', subtitle: 'תת כותרת', backgroundImage: '' };
      case 'text':
        return { text: 'הכנס טקסט כאן...' };
      case 'image':
        return { url: '', alt: 'תמונה' };
      case 'gift':
        return { title: 'מתנת הצטרפות', description: 'תיאור המתנה' };
      case 'form':
        return { title: 'הרשמו עכשיו' };
      default:
        return {};
    }
  }

  const generateAIContent = async (blockType) => {
    setAiLoading(true);
    try {
      const prompts = {
        hero: `צור כותרת מרכזית מושכת וקליטה לדף הרשמה של מסעדה יוקרתית בשם "${restaurant?.name}". הכותרת צריכה להיות קצרה (עד 60 תווים) ומעוררת פעולה. גם תת-כותרת (עד 100 תווים).`,
        text: `כתוב טקסט שיווקי מושך ומקצועי למסעדה יוקרתית בשם "${restaurant?.name}". הטקסט צריך לתאר את החוויה הקולינרית הייחודית ולעודד הרשמה למועדון הלקוחות.`,
        gift: `צור תיאור מפתה למתנת הצטרפות של מסעדה יוקרתית "${restaurant?.name}". התיאור צריך להיות קצר ומעורר תיאבון.`
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[blockType] || prompts.text,
        response_json_schema: {
          type: "object",
          properties: blockType === 'hero' ? {
            title: { type: "string" },
            subtitle: { type: "string" }
          } : {
            text: { type: "string" }
          }
        }
      });

      toast.success('תוכן נוצר בהצלחה!');
      return result;
    } catch (error) {
      toast.error('שגיאה ביצירת תוכן');
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  const duplicateBlock = (block) => {
    const newBlock = {
      ...block,
      id: `block_${Date.now()}`
    };
    const index = blocks.findIndex(b => b.id === block.id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
  };

  const signupUrl = restaurant?.signup_slug 
    ? `${window.location.origin}${createPageUrl('CustomerSignup')}?slug=${restaurant.signup_slug}`
    : '';

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="בונה דפי נחיתה"
        subtitle="עצב דף נחיתה מותאם אישית למסעדה שלך"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={() => setPreviewMode(!previewMode)}
              variant="outline"
            >
              <Eye className="w-4 h-4 ml-2" />
              {previewMode ? 'חזור לעריכה' : 'תצוגה מקדימה'}
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              שמור שינויים
            </Button>
          </div>
        }
      />

      {signupUrl && (
        <Card className="border-[#C5A059]/30 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#0F172A] mb-1">קישור לדף ההרשמה שלך:</p>
                <p className="text-xs text-gray-600 font-mono">{signupUrl}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(signupUrl);
                  toast.success('הקישור הועתק!');
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {previewMode ? (
        <PreviewMode blocks={blocks} restaurant={restaurant} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>מבנה הדף</CardTitle>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  size="sm"
                  className="bg-[#C5A059] hover:bg-[#B8934D] text-white"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף בלוק
                </Button>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="blocks">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                        {blocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={block.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-4 rounded-lg border-2 transition-all cursor-move ${
                                  selectedBlock?.id === block.id
                                    ? 'border-[#C5A059] bg-[#C5A059]/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedBlock(block)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#F5F7FA] flex items-center justify-center">
                                      {blockTypes.find(t => t.type === block.type)?.icon && 
                                        React.createElement(blockTypes.find(t => t.type === block.type).icon, { 
                                          className: "w-4 h-4 text-[#C5A059]" 
                                        })
                                      }
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">
                                        {blockTypes.find(t => t.type === block.type)?.label || block.type}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {block.content.title || block.content.text?.substring(0, 30) || 'ללא תוכן'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        duplicateBlock(block);
                                      }}
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteBlock(block.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          </div>

          {/* Properties Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>עריכת בלוק</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBlock ? (
                  <BlockEditor
                    block={selectedBlock}
                    restaurant={restaurant}
                    onUpdate={(content) => updateBlock(selectedBlock.id, content)}
                    onGenerateAI={(type) => generateAIContent(type)}
                    aiLoading={aiLoading}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Layout className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">בחר בלוק לעריכה</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Block Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>הוסף בלוק חדש</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {blockTypes.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-[#C5A059] hover:bg-[#C5A059]/5 transition-all"
              >
                <Icon className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                <p className="text-sm font-medium">{label}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BlockEditor({ block, restaurant, onUpdate, onGenerateAI, aiLoading }) {
  const [content, setContent] = useState(block.content);

  useEffect(() => {
    setContent(block.content);
  }, [block.id]);

  const handleChange = (key, value) => {
    const newContent = { ...content, [key]: value };
    setContent(newContent);
    onUpdate(newContent);
  };

  const applyAIContent = async () => {
    const result = await onGenerateAI(block.type);
    if (result) {
      const newContent = { ...content, ...result };
      setContent(newContent);
      onUpdate(newContent);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={applyAIContent}
        disabled={aiLoading}
        variant="outline"
        className="w-full"
      >
        {aiLoading ? (
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 ml-2" />
        )}
        צור תוכן עם AI
      </Button>

      {block.type === 'hero' && (
        <>
          <div className="space-y-2">
            <Label>כותרת ראשית</Label>
            <Input
              value={content.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="הכנס כותרת..."
            />
          </div>
          <div className="space-y-2">
            <Label>תת-כותרת</Label>
            <Input
              value={content.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              placeholder="הכנס תת-כותרת..."
            />
          </div>
          <div className="space-y-2">
            <Label>תמונת רקע (URL)</Label>
            <Input
              value={content.backgroundImage || ''}
              onChange={(e) => handleChange('backgroundImage', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </>
      )}

      {block.type === 'text' && (
        <div className="space-y-2">
          <Label>טקסט</Label>
          <Textarea
            value={content.text || ''}
            onChange={(e) => handleChange('text', e.target.value)}
            placeholder="הכנס טקסט..."
            rows={6}
          />
        </div>
      )}

      {block.type === 'image' && (
        <>
          <div className="space-y-2">
            <Label>קישור לתמונה</Label>
            <Input
              value={content.url || ''}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>טקסט חלופי</Label>
            <Input
              value={content.alt || ''}
              onChange={(e) => handleChange('alt', e.target.value)}
              placeholder="תיאור התמונה"
            />
          </div>
        </>
      )}

      {block.type === 'gift' && (
        <>
          <div className="space-y-2">
            <Label>כותרת</Label>
            <Input
              value={content.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="מתנת הצטרפות"
            />
          </div>
          <div className="space-y-2">
            <Label>תיאור המתנה</Label>
            <Textarea
              value={content.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="תיאור המתנה..."
              rows={4}
            />
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-900">
              💡 המתנה מוגדרת בהגדרות המסעדה: <strong>{restaurant?.welcome_gift || 'לא הוגדר'}</strong>
            </p>
          </div>
        </>
      )}

      {block.type === 'form' && (
        <div className="space-y-2">
          <Label>כותרת הטופס</Label>
          <Input
            value={content.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="הרשמו עכשיו"
          />
        </div>
      )}
    </div>
  );
}

function PreviewMode({ blocks, restaurant }) {
  return (
    <Card className="border-[#C5A059]/30">
      <CardContent className="p-0">
        <div className="bg-gradient-to-br from-amber-50 to-white min-h-[600px]">
          {blocks.map((block) => (
            <PreviewBlock key={block.id} block={block} restaurant={restaurant} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewBlock({ block, restaurant }) {
  const { type, content } = block;

  if (type === 'hero') {
    return (
      <div 
        className="relative py-20 px-6 text-center"
        style={{
          backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {content.backgroundImage && <div className="absolute inset-0 bg-black/40" />}
        <div className="relative z-10">
          {restaurant?.logo_url && (
            <img src={restaurant.logo_url} alt="" className="w-24 h-24 object-contain mx-auto mb-4" />
          )}
          <h1 className="text-4xl font-bold text-[#0F172A] mb-3">{content.title}</h1>
          <p className="text-lg text-gray-600">{content.subtitle}</p>
        </div>
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="py-12 px-6 max-w-3xl mx-auto">
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.text}</p>
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="py-8 px-6">
        {content.url && (
          <img 
            src={content.url} 
            alt={content.alt} 
            className="max-w-2xl mx-auto rounded-xl shadow-lg"
          />
        )}
      </div>
    );
  }

  if (type === 'gift') {
    return (
      <div className="py-12 px-6 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-[#C5A059]/10 to-[#C5A059]/5 rounded-xl p-8 text-center border-2 border-dashed border-[#C5A059]">
          <Gift className="w-16 h-16 text-[#C5A059] mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-[#0F172A] mb-2">{content.title}</h3>
          <p className="text-gray-700">{content.description}</p>
          {restaurant?.welcome_gift && (
            <div className="mt-4 inline-block bg-[#C5A059] text-white px-6 py-2 rounded-full font-medium">
              {restaurant.welcome_gift}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="py-12 px-6 max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{content.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="שם מלא *" disabled />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="טלפון *" disabled />
              <Input placeholder="אימייל" disabled />
            </div>
            <Button className="w-full bg-[#C5A059] hover:bg-[#B8934D] text-white" disabled>
              הצטרף עכשיו
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}