"use client";

import { Trans } from "@lingui/react/macro";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion";
import type { Notes, NoteEntry } from "@/lib/supabase/types";

interface BandNotesProps {
  data: Notes;
}

export function BandNotes({ data }: BandNotesProps) {
  if (!data.notes || data.notes.length === 0) {
    return (
      <p className="text-gray-500 italic">
        <Trans>No notes available.</Trans>
      </p>
    );
  }

  return (
    <Accordion type="multiple" className="space-y-2">
      {data.notes.map((note, index) => (
        <NoteItem key={index} note={note} index={index} />
      ))}
    </Accordion>
  );
}

function NoteItem({ note, index }: { note: NoteEntry; index: number }) {
  const title =
    note.title ||
    (note.note_number !== undefined
      ? `Note ${note.note_number}`
      : `Note ${index + 1}`);

  return (
    <AccordionItem value={`note-${index}`}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>
        <div className="prose prose-sm max-w-none">
          {note.content ? (
            <p className="whitespace-pre-wrap">{note.content}</p>
          ) : (
            <p className="text-gray-500 italic">
              <Trans>No content available.</Trans>
            </p>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
