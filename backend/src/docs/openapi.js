module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Bursary Platform API',
    version: '1.0.0',
    description: 'Secure backend API for bursary management, applications, profiles, and social features.'
  },
  servers: [
    { url: 'http://localhost:5000', description: 'Local development' }
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Bursaries' },
    { name: 'Applications' },
    { name: 'Profiles' },
    { name: 'Social' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password', 'role'],
        properties: {
          fullName: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          password: { type: 'string', example: 'StrongPassword123!' },
          role: { type: 'string', enum: ['learner', 'provider'] }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      BursaryRequest: {
        type: 'object',
        required: ['title', 'description', 'amount', 'deadline'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'number', format: 'float', example: 12000 },
          deadline: { type: 'string', format: 'date' }
        }
      },
      ApplicationRequest: {
        type: 'object',
        required: ['bursaryId', 'motivation'],
        properties: {
          bursaryId: { type: 'string', format: 'uuid' },
          motivation: { type: 'string' }
        }
      },
      ProfileUpdateRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          bio: { type: 'string' },
          institution: { type: 'string' },
          fieldOfStudy: { type: 'string' },
          avatarUrl: { type: 'string' }
        }
      },
      PostRequest: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string', maxLength: 2000 }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { 200: { description: 'Service healthy' } }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register learner/provider',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } }
        },
        responses: { 201: { description: 'User registered' }, 400: { description: 'Validation error' } }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } }
        },
        responses: { 200: { description: 'User logged in' }, 401: { description: 'Invalid credentials' } }
      }
    },
    '/api/bursaries': {
      get: {
        tags: ['Bursaries'],
        summary: 'List open bursaries',
        responses: { 200: { description: 'Bursaries listed' } }
      },
      post: {
        tags: ['Bursaries'],
        summary: 'Create bursary (provider)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BursaryRequest' } } }
        },
        responses: { 201: { description: 'Bursary created' }, 403: { description: 'Forbidden' } }
      }
    },
    '/api/bursaries/{id}': {
      patch: {
        tags: ['Bursaries'],
        summary: 'Update bursary (provider owner)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BursaryRequest' } } }
        },
        responses: { 200: { description: 'Bursary updated' }, 404: { description: 'Not found' } }
      }
    },
    '/api/bursaries/{id}/close': {
      patch: {
        tags: ['Bursaries'],
        summary: 'Close bursary (provider owner)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Bursary closed' } }
      }
    },
    '/api/applications': {
      post: {
        tags: ['Applications'],
        summary: 'Apply for bursary (learner)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicationRequest' } } }
        },
        responses: { 201: { description: 'Application submitted' } }
      }
    },
    '/api/applications/mine': {
      get: {
        tags: ['Applications'],
        summary: 'List current learner applications',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Applications listed' } }
      }
    },
    '/api/profiles/me': {
      get: {
        tags: ['Profiles'],
        summary: 'Get own profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Profile retrieved' } }
      },
      patch: {
        tags: ['Profiles'],
        summary: 'Update own profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileUpdateRequest' } } }
        },
        responses: { 200: { description: 'Profile updated' } }
      }
    },
    '/api/profiles/{userId}': {
      get: {
        tags: ['Profiles'],
        summary: 'Get public profile by user id',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Public profile returned' } }
      }
    },
    '/api/social/follow/{userId}': {
      post: {
        tags: ['Social'],
        summary: 'Follow user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 201: { description: 'Followed' } }
      },
      delete: {
        tags: ['Social'],
        summary: 'Unfollow user',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Unfollowed' } }
      }
    },
    '/api/social/followers': {
      get: {
        tags: ['Social'],
        summary: 'List my followers',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Followers listed' } }
      }
    },
    '/api/social/following': {
      get: {
        tags: ['Social'],
        summary: 'List users I follow',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Following listed' } }
      }
    },
    '/api/social/posts': {
      post: {
        tags: ['Social'],
        summary: 'Create post',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PostRequest' } } }
        },
        responses: { 201: { description: 'Post created' } }
      }
    },
    '/api/social/feed': {
      get: {
        tags: ['Social'],
        summary: 'Get social feed',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Feed returned' } }
      }
    },
    '/api/social/posts/{postId}/like': {
      post: {
        tags: ['Social'],
        summary: 'Like post',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'postId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 201: { description: 'Post liked' } }
      },
      delete: {
        tags: ['Social'],
        summary: 'Unlike post',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'postId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Post unliked' } }
      }
    }
  }
}
