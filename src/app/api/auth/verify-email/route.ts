import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, code } = await request.json(); 

    if (!email || !code) { 
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { error: 'Please provide a valid 6-digit verification code' },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      email: email, 
      verificationCode: code,
      verificationCodeExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    user.emailVerified = new Date();
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}