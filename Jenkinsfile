pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        DATABASE_URL = 'mongodb://demo-vibe-mongo:27017/demo-vibe-test?replicaSet=rs0'
        JWT_SECRET = 'jenkins-test-secret-key'
        JWT_REFRESH_SECRET = 'jenkins-test-refresh-secret-key'
    }

    tools {
        nodejs "${NODE_VERSION}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Frontend') {
                    steps {
                        sh 'npm ci'
                    }
                }
                stage('Backend') {
                    steps {
                        dir('server') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Generate Prisma Client') {
            steps {
                sh 'npx prisma generate'
            }
        }

        stage('Lint') {
            parallel {
                stage('Frontend Lint') {
                    steps {
                        sh 'npm run lint || true'
                    }
                }
                stage('Backend Lint') {
                    steps {
                        dir('server') {
                            sh 'npx tsc --noEmit || true'
                        }
                    }
                }
            }
        }

        stage('Test') {
            steps {
                dir('server') {
                    sh 'npm run test -- --passWithNoTests --forceExit'
                }
            }
        }

        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('server') {
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh 'npm run build'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished'
        }
        success {
            echo 'Build successful!'
        }
        failure {
            echo 'Build failed!'
        }
    }
}
