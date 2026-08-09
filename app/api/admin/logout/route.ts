import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Clear the secure HttpOnly cookie
    response.cookies.set({
        name: 'ms-admin-token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0, // Expires immediately
        path: '/',
    });

    return response;
}