#!/usr/bin/env node
/**
 * Firebase IAM Setup Script
 * 
 * This script helps verify and set up the required IAM roles for Firebase Cloud Functions
 * to properly access Firebase Authentication (Identity Toolkit API).
 * 
 * PREREQUISITES:
 * 1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
 * 2. Login to gcloud: gcloud auth login
 * 3. Set your project: gcloud config set project hoas-65dee
 * 
 * REQUIRED APIS (Enable in GCP Console):
 * 1. Identity Toolkit API - Required for Firebase Auth operations
 * 2. Cloud Functions API - Required for deploying Cloud Functions
 * 3. Cloud Firestore API - Required for Firestore access
 * 4. Firebase Authentication API - Required for auth operations
 * 5. Service Usage API - Required for checking API status
 * 
 * REQUIRED IAM ROLES for the Cloud Functions service account:
 * - roles/firebase.admin (Firebase Admin)
 * - roles/firebaseauth.admin (Firebase Authentication Admin)
 * - roles/datastore.user (Cloud Datastore User)
 * - roles/iam.serviceAccountTokenCreator (Service Account Token Creator)
 * 
 * Run this script: node setup-iam.js
 */

import { execSync } from 'child_process';

const PROJECT_ID = 'hoas-65dee';

// Required APIs
const REQUIRED_APIS = [
    'identitytoolkit.googleapis.com',
    'cloudfunctions.googleapis.com',
    'firestore.googleapis.com',
    'firebase.googleapis.com',
    'serviceusage.googleapis.com',
    'secretmanager.googleapis.com',
];

// Required IAM roles for the default Cloud Functions service account
const REQUIRED_ROLES = [
    'roles/firebase.admin',
    'roles/firebaseauth.admin',
    'roles/datastore.user',
    'roles/iam.serviceAccountTokenCreator',
];

function runCommand(command, silent = false) {
    try {
        const output = execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
        return { success: true, output };
    } catch (error) {
        return { success: false, error: error.message, output: error.stdout };
    }
}

function checkGcloudInstalled() {
    console.log('\n🔍 Checking gcloud CLI installation...');
    const result = runCommand('gcloud --version', true);
    if (!result.success) {
        console.error('❌ gcloud CLI not found. Please install Google Cloud SDK:');
        console.error('   https://cloud.google.com/sdk/docs/install');
        return false;
    }
    console.log('✅ gcloud CLI is installed');
    return true;
}

function getDefaultServiceAccount() {
    return `${PROJECT_ID}@appspot.gserviceaccount.com`;
}

function printInstructions() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 MANUAL SETUP INSTRUCTIONS');
    console.log('='.repeat(80));

    console.log('\n🌐 STEP 1: Enable Required APIs in Google Cloud Console');
    console.log('   Go to: https://console.cloud.google.com/apis/library?project=' + PROJECT_ID);
    console.log('   Search and enable each of these APIs:');
    REQUIRED_APIS.forEach((api, i) => {
        console.log(`   ${i + 1}. ${api}`);
    });

    console.log('\n🔐 STEP 2: Add IAM Roles to Cloud Functions Service Account');
    console.log('   Go to: https://console.cloud.google.com/iam-admin/iam?project=' + PROJECT_ID);
    console.log(`   Find the service account: ${getDefaultServiceAccount()}`);
    console.log('   Add these roles:');
    REQUIRED_ROLES.forEach((role, i) => {
        console.log(`   ${i + 1}. ${role.replace('roles/', '')}`);
    });

    console.log('\n🔥 STEP 3: Verify Firebase Console Settings');
    console.log('   Go to: https://console.firebase.google.com/project/' + PROJECT_ID + '/settings/general');
    console.log('   - Ensure your app is registered for mobile (if using native mobile app)');
    console.log('   - Check that OAuth consent screen is configured');
    console.log('   - Verify authorized domains include your app domains');

    console.log('\n📱 STEP 4: For Mobile Apps (React Native, Flutter, etc.)');
    console.log('   - Add your Android package name / iOS bundle ID to Firebase project');
    console.log('   - Download and add google-services.json (Android) or GoogleService-Info.plist (iOS)');
    console.log('   - Ensure SHA-1 fingerprint is added for Android (for OAuth)');

    console.log('\n🚀 STEP 5: Redeploy Cloud Functions');
    console.log('   Run: firebase deploy --only functions');
    console.log('   Or: npm run deploy (from the HOAS directory)');

    console.log('\n' + '='.repeat(80));
    console.log('📞 If issues persist, check Firebase Functions logs:');
    console.log('   firebase functions:log');
    console.log('='.repeat(80) + '\n');
}

function printGcloudCommands() {
    const serviceAccount = getDefaultServiceAccount();

    console.log('\n' + '='.repeat(80));
    console.log('⌨️  GCLOUD CLI COMMANDS (Optional - for automation)');
    console.log('='.repeat(80));

    console.log('\n# Enable required APIs:');
    REQUIRED_APIS.forEach(api => {
        console.log(`gcloud services enable ${api} --project=${PROJECT_ID}`);
    });

    console.log('\n# Add IAM roles to service account:');
    REQUIRED_ROLES.forEach(role => {
        console.log(`gcloud projects add-iam-policy-binding ${PROJECT_ID} \\`);
        console.log(`  --member="serviceAccount:${serviceAccount}" \\`);
        console.log(`  --role="${role}"`);
    });

    console.log('\n# Verify current IAM bindings:');
    console.log(`gcloud projects get-iam-policy ${PROJECT_ID} --format="table(bindings.role,bindings.members)"`);

    console.log('\n' + '='.repeat(80) + '\n');
}

function main() {
    console.log('🔧 Firebase IAM Setup Helper for HOAS');
    console.log('=====================================\n');
    console.log('Project ID:', PROJECT_ID);
    console.log('Service Account:', getDefaultServiceAccount());

    const hasGcloud = checkGcloudInstalled();

    printInstructions();

    if (hasGcloud) {
        printGcloudCommands();
    }

    console.log('\n✨ After completing these steps, restart your mobile app and try again.');
}

main();
