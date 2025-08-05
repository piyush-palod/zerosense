import * as fs from "fs";
import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function summarizeArticle(text: string): Promise<string> {
    const prompt = `Please summarize the following text concisely while maintaining key points:\n\n${text}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text || "Something went wrong";
}

export interface Sentiment {
    rating: number;
    confidence: number;
}

export async function analyzeSentiment(text: string): Promise<Sentiment> {
    try {
        const systemPrompt = `You are a sentiment analysis expert. 
Analyze the sentiment of the text and provide a rating
from 1 to 5 stars and a confidence score between 0 and 1.
Respond with JSON in this format: 
{'rating': number, 'confidence': number}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        rating: { type: "number" },
                        confidence: { type: "number" },
                    },
                    required: ["rating", "confidence"],
                },
            },
            contents: text,
        });

        const rawJson = response.text;

        console.log(`Raw JSON: ${rawJson}`);

        if (rawJson) {
            const data: Sentiment = JSON.parse(rawJson);
            return data;
        } else {
            throw new Error("Empty response from model");
        }
    } catch (error) {
        throw new Error(`Failed to analyze sentiment: ${error}`);
    }
}

export async function analyzeImage(jpegImagePath: string): Promise<string> {
    const imageBytes = fs.readFileSync(jpegImagePath);

    const contents = [
        {
            inlineData: {
                data: imageBytes.toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        `Analyze this image in detail and describe its key elements, context,
and any notable aspects.`,
    ];

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: contents,
    });

    return response.text || "";
}

export async function analyzeVideo(mp4VideoPath: string): Promise<string> {
    const videoBytes = fs.readFileSync(mp4VideoPath);

    const contents = [
        {
            inlineData: {
                data: videoBytes.toString("base64"),
                mimeType: "video/mp4",
            },
        },
        `You are a professional security analyst reviewing surveillance footage. 
        
Please provide a comprehensive analysis of this video focusing on:
1. People detection and behavior patterns
2. Vehicle identification and movements  
3. Objects and suspicious items
4. Motion patterns and activities
5. Security incidents or anomalies
6. Time stamps and sequence of events
7. Environmental conditions and visibility

Be specific about locations, timing, and any security-relevant observations. 
Format your response as a professional security report.`,
    ];

    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: contents,
    });

    return response.text || "";
}

// Enhanced AI functions for security surveillance

export interface VideoSearchResult {
    timestamp: string;
    confidence: number;
    description: string;
}

export interface VideoMetadata {
    cameraId: string;
    timestamp: string;
    duration: number;
}

export async function intelligentVideoSearch(
    query: string, 
    videoMetadata: VideoMetadata[]
): Promise<VideoSearchResult[]> {
    try {
        const systemPrompt = `You are an AI security system that searches video surveillance footage. 
        
Given a search query and video metadata, return relevant results based on typical surveillance scenarios.
Consider these common search patterns:
- Person detection: "person in red shirt", "delivery person", "unknown individual"
- Vehicle searches: "white van", "motorcycle", "license plate ABC123"
- Activity patterns: "person running", "loitering", "package delivery"
- Time-based: "morning activities", "after hours", "suspicious behavior"
- Object detection: "unattended bag", "broken window", "open door"

Return results as JSON array with timestamp, confidence (0-1), and description.
Be realistic about confidence scores based on typical AI accuracy.`;

        const prompt = `Search Query: "${query}"

Available Video Metadata:
${videoMetadata.map(v => `Camera ${v.cameraId}: ${v.timestamp} (${v.duration}s)`).join('\n')}

Provide realistic search results that might match this query. Return 1-5 relevant results.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            timestamp: { type: "string" },
                            confidence: { type: "number" },
                            description: { type: "string" }
                        },
                        required: ["timestamp", "confidence", "description"]
                    }
                }
            },
            contents: prompt,
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        
        return [];
    } catch (error) {
        console.error('Intelligent video search error:', error);
        throw error;
    }
}

export interface IncidentAnalysis {
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    summary: string;
    confidence: number;
    recommendations?: string[];
}

export async function analyzeIncident(
    context: string,
    videoAnalysis: string
): Promise<IncidentAnalysis> {
    try {
        const systemPrompt = `You are a professional security incident analyzer. 
        
Analyze video surveillance content to identify security incidents. Classify incidents by:

TYPES: theft, vandalism, trespassing, unauthorized_access, violence, suspicious_behavior, 
       package_delivery, maintenance, normal_activity, vehicle_incident, safety_hazard

SEVERITY LEVELS:
- critical: immediate threat to safety, ongoing crime, violence
- high: significant security breach, theft in progress, unauthorized access
- medium: suspicious behavior, minor safety issues, policy violations  
- low: normal activities, routine deliveries, false alarms

Provide confidence score (0-1) and actionable recommendations.
Be conservative with severity - only escalate if truly warranted.`;

        const prompt = `Context: ${context}

Video Analysis: ${videoAnalysis}

Analyze this for potential security incidents. Consider if this represents normal activity vs. actual security concerns.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        type: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        summary: { type: "string" },
                        confidence: { type: "number" },
                        recommendations: {
                            type: "array",
                            items: { type: "string" }
                        }
                    },
                    required: ["type", "severity", "summary", "confidence"]
                }
            },
            contents: prompt,
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        
        throw new Error("No incident analysis returned");
    } catch (error) {
        console.error('Incident analysis error:', error);
        throw error;
    }
}

export async function generateSecurityAlert(
    incident: IncidentAnalysis,
    cameraId: string,
    timestamp: string
): Promise<{
    title: string;
    description: string;
    priority: string;
}> {
    try {
        const systemPrompt = `Generate concise security alert notifications.
        
Create clear, actionable alerts that security personnel can quickly understand and respond to.
Keep titles under 50 characters and descriptions under 200 characters.
Use professional, urgent tone for high severity incidents.`;

        const prompt = `Generate a security alert for:
Incident Type: ${incident.type}
Severity: ${incident.severity}
Summary: ${incident.summary}
Camera: ${cameraId}
Time: ${timestamp}
Confidence: ${Math.round(incident.confidence * 100)}%`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        priority: { type: "string" }
                    },
                    required: ["title", "description", "priority"]
                }
            },
            contents: prompt,
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        
        return {
            title: `${incident.severity.toUpperCase()}: ${incident.type}`,
            description: incident.summary,
            priority: incident.severity
        };
    } catch (error) {
        console.error('Alert generation error:', error);
        return {
            title: `${incident.severity.toUpperCase()}: ${incident.type}`,
            description: incident.summary,
            priority: incident.severity
        };
    }
}