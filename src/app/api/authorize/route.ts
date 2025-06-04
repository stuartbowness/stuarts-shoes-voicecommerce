export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const requestBody = await request.json();
    
    console.log('LayerCode auth request:', {
      hasApiKey: !!process.env.LAYERCODE_API_KEY,
      requestBody
    });
    
    const response = await fetch("https://api.layercode.com/v1/pipelines/authorize_session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LAYERCODE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseData = await response.json();
    
    console.log('LayerCode auth response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    });
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('LayerCode auth error:', error);
    return NextResponse.json({ error: 'Authorization failed' }, { status: 500 });
  }
};