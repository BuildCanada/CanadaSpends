import React from "react";

interface UpdatedAtProps {
  children: React.ReactNode;
}
export default function UpdatedAt(props: UpdatedAtProps) {
  return (
    <div className="text-sm text-muted-foreground italic">{props.children}</div>
  );
}
