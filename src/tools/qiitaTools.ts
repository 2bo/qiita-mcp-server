import { z } from "zod";

const createSuccessResponse = (content: string): any => {
  return {
    content: [
      { 
        type: "text", 
        text: content 
      }
    ]
  };
};

const createErrorResponse = (errorMessage: string): any => {
  return {
    content: [
      { 
        type: "text", 
        text: `Error: ${errorMessage}` 
      }
    ],
    isError: true
  };
};

const getCurrentDateTime = (): any => {
  try {
    const now = new Date();
    const formattedDateTime = now.toLocaleString('ja-JP', { 
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    return createSuccessResponse(`現在の日時: ${formattedDateTime}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Error getting current date and time: ${errorMessage}`);
  }
};

export const getToolDefinitions = () => {
  return [
    {
      name: "get_current_datetime",
      description: "現在の日時を取得します",
      parameters: {} as z.ZodRawShape,
      handler: () => getCurrentDateTime()
    }
  ];
};
