import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function proxy(request: NextRequest) {  
  const protectedRoutes = ['/api/users', '/api/products'];

  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    // ✅ CHECK BOTH COOKIES AND AUTHORIZATION HEADER
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    const token = bearerToken || cookieToken;

    console.log('🔍 [Middleware] Checking auth:', {
      path: request.nextUrl.pathname,
      hasCookie: !!cookieToken,
      hasBearer: !!bearerToken,
      token: token ? token.substring(0, 30) + '...' : 'none',
    });

    if (!token) {
      console.log('❌ [Middleware] No token found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        temp?: boolean;
      };
      
      console.log('✅ [Middleware] Token verified:', {
        userId: decoded.userId,
        temp: decoded.temp,
      });
      
      // ✅ ALLOW TEMPORARY TOKENS
      if (decoded.temp) {
        console.log('⏰ [Middleware] Temp token - allowing access');
      }
      
    } catch (error) {
      console.error('❌ [Middleware] Invalid token:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};