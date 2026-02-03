/**
 * @fileoverview ALM API response dummy data for development and testing
 * 
 * WARNING: This file contains mock data for development purposes only.
 * Do NOT use this data in production. It should only be used for:
 * - Local development without ALM API access
 * - Unit testing
 * - UI prototyping
 * 
 * The data structure matches the actual ALM Prime API v2 response format.
 * 
 * @see https://learningmanager.adobe.com/primeapi/v2/docs
 */

export default {
  "links": {
    "self": "https://learningmanager.adobe.com/primeapi/v2/learningObjects?page[limit]=10&filter.loTypes=learningProgram",
    "next": "https://learningmanager.adobe.com/primeapi/v2/learningObjects?page[limit]=10&filter.loTypes=learningProgram&page[cursor]=10"
  },
  "data": [
    {
      "id": "learningProgram:160149",
      "type": "learningObject",
      "attributes": {
        "dateCreated": "2025-12-17T07:02:00.000Z",
        "dateUpdated": "2025-12-21T09:36:36.000Z",
        "duration": 14400,
        "enrollmentType": "Self Enroll",
        "isEnhancedLP": true,
        "loFormat": "Blended",
        "loType": "learningProgram",
        "state": "Published",
        "localizedMetadata": [
          {
            "description": "A comprehensive 4-week program covering advanced React patterns, state management, and performance optimization.",
            "locale": "en-US",
            "name": "Advanced React Development Cohort",
            "overview": "Master advanced React concepts through hands-on projects and live sessions with industry experts.",
            "richTextOverview": "<p>Master advanced React concepts through hands-on projects and live sessions with industry experts.</p>"
          }
        ],
        "rating": {
          "averageRating": 4.8,
          "ratingsCount": 156
        },
        "sections": [
          {
            "loIds": ["course:15132783"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184251",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 1: Advanced Hooks"
              }
            ]
          },
          {
            "loIds": ["course:14705513"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184252",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 2: State Management"
              }
            ]
          },
          {
            "loIds": ["course:15025564"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184253",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 3: Performance"
              }
            ]
          },
          {
            "loIds": ["course:15024093"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184254",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 4: Testing & Deployment"
              }
            ]
          }
        ]
      },
      "links": {
        "self": "https://learningmanager.adobe.com/primeapi/v2/learningObjects/learningProgram:160149"
      }
    },
    {
      "id": "learningProgram:160250",
      "type": "learningObject",
      "attributes": {
        "dateCreated": "2025-11-05T08:15:00.000Z",
        "dateUpdated": "2025-12-10T14:20:30.000Z",
        "duration": 21600,
        "enrollmentType": "Self Enroll",
        "isEnhancedLP": true,
        "loFormat": "Blended",
        "loType": "learningProgram",
        "state": "Published",
        "localizedMetadata": [
          {
            "description": "Learn full-stack development with Node.js, Express, MongoDB, and modern frontend frameworks in this intensive 6-week program.",
            "locale": "en-US",
            "name": "Full Stack JavaScript Development",
            "overview": "Build production-ready web applications from scratch with industry best practices.",
            "richTextOverview": "<p>Build production-ready web applications from scratch with industry best practices.</p>"
          }
        ],
        "rating": {
          "averageRating": 4.6,
          "ratingsCount": 203
        },
        "sections": [
          {
            "loIds": ["course:15132784"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184301",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 1-2: Backend Fundamentals"
              }
            ]
          },
          {
            "loIds": ["course:15132785"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184302",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 3-4: Database & APIs"
              }
            ]
          },
          {
            "loIds": ["course:15132786"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184303",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 5-6: Frontend Integration"
              }
            ]
          }
        ]
      },
      "links": {
        "self": "https://learningmanager.adobe.com/primeapi/v2/learningObjects/learningProgram:160250"
      }
    },
    {
      "id": "learningProgram:160351",
      "type": "learningObject",
      "attributes": {
        "dateCreated": "2025-10-20T10:30:00.000Z",
        "dateUpdated": "2025-12-15T11:45:15.000Z",
        "duration": 10800,
        "enrollmentType": "Self Enroll",
        "isEnhancedLP": true,
        "loFormat": "Blended",
        "loType": "learningProgram",
        "state": "Published",
        "localizedMetadata": [
          {
            "description": "Master cloud architecture, DevOps practices, and infrastructure as code in this comprehensive 3-week program.",
            "locale": "en-US",
            "name": "Cloud Architecture & DevOps Bootcamp",
            "overview": "Deploy scalable applications on AWS, Azure, and GCP with modern DevOps tools.",
            "richTextOverview": "<p>Deploy scalable applications on AWS, Azure, and GCP with modern DevOps tools.</p>"
          }
        ],
        "rating": {
          "averageRating": 4.9,
          "ratingsCount": 89
        },
        "sections": [
          {
            "loIds": ["course:15132787"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184401",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 1: Cloud Fundamentals"
              }
            ]
          },
          {
            "loIds": ["course:15132788"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184402",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 2: CI/CD & Automation"
              }
            ]
          },
          {
            "loIds": ["course:15132789"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184403",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 3: Monitoring & Scaling"
              }
            ]
          }
        ]
      },
      "links": {
        "self": "https://learningmanager.adobe.com/primeapi/v2/learningObjects/learningProgram:160351"
      }
    },
    {
      "id": "learningProgram:160452",
      "type": "learningObject",
      "attributes": {
        "dateCreated": "2025-09-15T09:00:00.000Z",
        "dateUpdated": "2025-12-01T16:30:45.000Z",
        "duration": 28800,
        "enrollmentType": "Self Enroll",
        "isEnhancedLP": true,
        "loFormat": "Blended",
        "loType": "learningProgram",
        "state": "Published",
        "localizedMetadata": [
          {
            "description": "Transform your career with machine learning, deep learning, and AI applications in this 8-week intensive program.",
            "locale": "en-US",
            "name": "Machine Learning & AI Engineering",
            "overview": "Build and deploy ML models using Python, TensorFlow, and cloud platforms.",
            "richTextOverview": "<p>Build and deploy ML models using Python, TensorFlow, and cloud platforms.</p>"
          }
        ],
        "rating": {
          "averageRating": 4.7,
          "ratingsCount": 342
        },
        "sections": [
          {
            "loIds": ["course:15132790"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184501",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 1-2: Python & Data Science"
              }
            ]
          },
          {
            "loIds": ["course:15132791"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184502",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 3-4: Machine Learning"
              }
            ]
          },
          {
            "loIds": ["course:15132792"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184503",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 5-6: Deep Learning"
              }
            ]
          },
          {
            "loIds": ["course:15132793"],
            "mandatory": true,
            "mandatoryLOCount": 1,
            "sectionId": "184504",
            "localizedMetadata": [
              {
                "locale": "en-US",
                "name": "Week 7-8: Model Deployment"
              }
            ]
          }
        ]
      },
      "links": {
        "self": "https://learningmanager.adobe.com/primeapi/v2/learningObjects/learningProgram:160452"
      }
    }
  ],
  "meta": {
    "count": 4
  }
};
