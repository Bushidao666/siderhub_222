// Simple integration test for drip content functionality
const { createAcademyRouter } = require('./src/backend/api/academy');

// Mock dependencies
const mockServices = {
  academyService: {
    updateComplexDripConfig: async (courseId, config) => {
      console.log('✅ updateComplexDripConfig called with:', { courseId, config });
      return Promise.resolve();
    }
  }
};

// Create router
const router = createAcademyRouter(mockServices);

// Mock request/response
const mockReq = {
  params: { courseId: '123e4567-e89b-12d3-a456-426614174000' },
  user: { userId: 'user-123' },
  body: {
    courseId: '123e4567-e89b-12d3-a456-426614174000',
    modules: [
      {
        id: 'module-1',
        title: 'Module 1',
        dripRule: {
          type: 'days_after',
          daysAfter: 7
        },
        enabled: true
      },
      {
        id: 'module-2',
        title: 'Module 2',
        dripRule: {
          type: 'after_completion',
          afterModuleId: 'module-1'
        },
        enabled: true
      }
    ],
    defaultDripType: 'days_after',
    enablePreviewContent: true,
    unlockOnEnrollment: true,
    autoUnlockFirstModule: true
  }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`✅ Response ${code}:`, data);
    }
  })
};

console.log('🧪 Testing Drip Content Integration...');

// Test the complex drip config endpoint
const middleware = router.stack.find(
  layer => layer.route?.path === '/admin/academy/courses/:courseId/drip-config' &&
           layer.route?.methods?.includes('put')
);

if (middleware) {
  console.log('✅ Found drip config endpoint');

  // Simulate the request
  middleware.handle(mockReq, mockRes, (err) => {
    if (err) {
      console.error('❌ Error:', err);
    } else {
      console.log('✅ Drip content integration test passed!');
    }
  });
} else {
  console.error('❌ Drip config endpoint not found');
}