import { useState } from "react";
import { Folder, Plus, Check, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Props {
  categories: Category[];
  onAdd: (name: string, color: string) => void;
  onEdit: (id: string, name: string, color: string) => void;
  onDelete: (id: string) => void;
}

const COLORS = [
  { v: "blue", c: "bg-blue-100 text-blue-700 border-blue-200" },
  { v: "green", c: "bg-green-100 text-green-700 border-green-200" },
  { v: "purple", c: "bg-purple-100 text-purple-700 border-purple-200" },
  { v: "orange", c: "bg-orange-100 text-orange-700 border-orange-200" },
  { v: "pink", c: "bg-pink-100 text-pink-700 border-pink-200" },
  { v: "gray", c: "bg-gray-100 text-gray-700 border-gray-200" },
];

export function CategoryManager({ categories, onAdd, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");

  const save = () => {
    if (!name.trim()) return;
    if (editing === "new") {
      onAdd(name.trim(), color);
    } else if (editing) {
      onEdit(editing, name.trim(), color);
    }
    reset();
  };

  const reset = () => {
    setEditing(null);
    setName("");
    setColor("blue");
  };

  const edit = (cat: Category) => {
    setEditing(cat.id);
    setName(cat.name);
    setColor(cat.color);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Categories</h3>
        {!editing && (
          <button
            onClick={() => setEditing("new")}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add
          </button>
        )}
      </div>

      <div className="space-y-1">
        {editing && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            <div className="flex gap-1">
              {COLORS.map((c) => (
                <button
                  key={c.v}
                  onClick={() => setColor(c.v)}
                  className={`flex-1 h-5 rounded border-2 transition ${c.c} ${
                    color === c.v ? "border-gray-900" : "border-transparent"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={save}
                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                <Check className="w-3 h-3 mx-auto" />
              </button>
              <button
                onClick={reset}
                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
              {editing !== "new" && (
                <button
                  onClick={() => {
                    onDelete(editing);
                    reset();
                  }}
                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => edit(cat)}
            disabled={!!editing}
            className={`w-full px-2 py-1.5 text-sm rounded flex items-center gap-2 text-left transition ${
              COLORS.find((c) => c.v === cat.color)?.c
            } ${editing ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
          >
            <Folder className="w-3 h-3" />
            <span className="flex-1 truncate">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function getCategoryColor(color: string) {
  const map: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-green-100 text-green-700 border-green-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    pink: "bg-pink-100 text-pink-700 border-pink-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return map[color] || map.gray;
}
