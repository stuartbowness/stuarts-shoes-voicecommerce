export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const requestBody = await request.json();
  
  const response = await fetch("https://api.layercode.com/v1/pipelines/authorize_session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LAYERCODE_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });
  
  return NextResponse.json(await response.json());
};