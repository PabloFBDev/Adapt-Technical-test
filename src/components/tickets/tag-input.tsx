"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  error?: string;
}

export function TagInput({ value, onChange, maxTags = 10, error }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (trimmed.length > 30) return;
    if (value.includes(trimmed)) return;
    if (value.length >= maxTags) return;

    onChange([...value, trimmed]);
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer font-mono text-[11px] gap-1 pr-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
              onClick={() => removeTag(index)}
            >
              {tag}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length >= maxTags ? "Limite atingido" : "Adicionar tag (Enter ou virgula)"}
        disabled={value.length >= maxTags}
      />
      {error && (
        <p className="font-mono text-xs text-destructive flex items-center gap-1 animate-scale-in">
          <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  );
}
