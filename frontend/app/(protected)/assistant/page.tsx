import ChatAssistant from "@/components/ai/ChatAssistant";

export default function AssistantPage() {
  return (
    <div className="assistant-page pb-24 lg:pb-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Powered by Gemini — sign in required.
        </p>
      </div>
      <ChatAssistant />
    </div>
  );
}
