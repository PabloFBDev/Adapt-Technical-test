"use client";

import { useState, type KeyboardEvent } from "react";
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
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => removeTag(index)}
          >
            {tag} &times;
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length >= maxTags ? "Limite atingido" : "Adicionar tag (Enter ou virgula)"}
        disabled={value.length >= maxTags}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
