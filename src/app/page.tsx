import ThreeScene from "@/components/cybernox/ThreeScene";
import ToolbarLeft from "@/components/cybernox/ToolbarLeft";
import ToolbarRight from "@/components/cybernox/ToolbarRight";
import ObjectListPanel from "@/components/cybernox/ObjectListPanel";

export default function Cybernox3DPage() {
  return (
    <div className="flex h-screen w-screen overflow-hidden antialiased font-body bg-background">
      <ToolbarLeft />
      <main className="flex-1 relative overflow-hidden">
        <ThreeScene />
      </main>
      <aside className="w-72 bg-card border-l border-border flex flex-col shadow-lg">
        <div className="p-3 border-b border-border">
           <ToolbarRight />
        </div>
        <div className="flex-grow min-h-0"> {/* This div allows ObjectListPanel to take remaining space and scroll */}
          <ObjectListPanel />
        </div>
      </aside>
    </div>
  );
}
