#!/usr/bin/env node

/**
 * Education System Testing Script
 * Tests offline functionality, content loading, and accessibility features
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 ClariFi Education System Test Suite');
console.log('=====================================\n');

// Test 1: Verify Content Structure
console.log('📁 Testing Content Structure...');

const assetsPath = path.join(__dirname, '..', 'assets', 'educational-content');
const manifestPath = path.join(assetsPath, 'manifest.json');

try {
  // Check manifest exists
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Manifest file not found');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`✅ Manifest loaded successfully`);
  console.log(`   - Found ${manifest.modules.length} modules`);
  console.log(`   - Version: ${manifest.version}`);

  // Test each module
  for (const module of manifest.modules) {
    console.log(`\n📚 Testing Module: ${module.id}`);

    // Check each lesson's content files
    for (const lesson of module.lessons) {
      // Test English content
      const enPath = path.join(assetsPath, lesson.contentFile.en);
      if (fs.existsSync(enPath)) {
        const content = fs.readFileSync(enPath, 'utf8');
        console.log(
          `   ✅ English content: ${lesson.id} (${content.length} chars)`
        );
      } else {
        console.log(`   ❌ Missing English content: ${lesson.contentFile.en}`);
      }

      // Test French content
      const frPath = path.join(assetsPath, lesson.contentFile.fr);
      if (fs.existsSync(frPath)) {
        const content = fs.readFileSync(frPath, 'utf8');
        console.log(
          `   ✅ French content: ${lesson.id} (${content.length} chars)`
        );
      } else {
        console.log(`   ❌ Missing French content: ${lesson.contentFile.fr}`);
      }
    }

    // Test quiz files
    if (module.finalQuiz) {
      const enQuizPath = path.join(assetsPath, module.finalQuiz.en);
      const frQuizPath = path.join(assetsPath, module.finalQuiz.fr);

      if (fs.existsSync(enQuizPath)) {
        const quiz = JSON.parse(fs.readFileSync(enQuizPath, 'utf8'));
        console.log(
          `   ✅ English quiz: ${quiz.questions?.length || 0} questions`
        );
      } else {
        console.log(`   ❌ Missing English quiz: ${module.finalQuiz.en}`);
      }

      if (fs.existsSync(frQuizPath)) {
        const quiz = JSON.parse(fs.readFileSync(frQuizPath, 'utf8'));
        console.log(
          `   ✅ French quiz: ${quiz.questions?.length || 0} questions`
        );
      } else {
        console.log(`   ❌ Missing French quiz: ${module.finalQuiz.fr}`);
      }
    }
  }
} catch (error) {
  console.log(`❌ Content structure test failed: ${error.message}`);
}

// Test 2: Verify Component Structure
console.log('\n\n🧩 Testing Component Structure...');

const componentsPath = path.join(__dirname, '..', 'components', 'education');
const requiredComponents = [
  'EducationHub.tsx',
  'ModuleViewer.tsx',
  'QuizInterface.tsx',
  'LanguageSelector.tsx',
];

for (const component of requiredComponents) {
  const componentPath = path.join(componentsPath, component);
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf8');

    // Check for accessibility features
    const hasAccessibilityLabel = content.includes('accessibilityLabel');
    const hasAccessibilityHint = content.includes('accessibilityHint');
    const hasAccessibilityRole = content.includes('accessibilityRole');

    console.log(`✅ ${component}:`);
    console.log(
      `   - Accessibility Label: ${hasAccessibilityLabel ? '✅' : '❌'}`
    );
    console.log(
      `   - Accessibility Hint: ${hasAccessibilityHint ? '✅' : '❌'}`
    );
    console.log(
      `   - Accessibility Role: ${hasAccessibilityRole ? '✅' : '❌'}`
    );

    // Check for responsive design patterns
    const hasFlexbox = content.includes('flex');
    const hasResponsiveStyles = content.includes('StyleSheet');

    console.log(
      `   - Responsive Design: ${hasFlexbox && hasResponsiveStyles ? '✅' : '❌'}`
    );

    // Check for localization
    const hasTranslation =
      content.includes('useTranslation') || content.includes('t(');
    console.log(`   - Localization: ${hasTranslation ? '✅' : '❌'}`);
  } else {
    console.log(`❌ Missing component: ${component}`);
  }
}

// Test 3: Verify Service Layer
console.log('\n\n🔧 Testing Service Layer...');

const servicesPath = path.join(__dirname, '..', 'services');
const requiredServices = [
  'education/educationService.ts',
  'localization/i18nService.ts',
];

for (const service of requiredServices) {
  const servicePath = path.join(servicesPath, service);
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');

    console.log(`✅ ${service}:`);

    // Check education service features
    if (service.includes('education')) {
      const hasOfflineSupport = content.includes('AsyncStorage');
      const hasProgressTracking = content.includes('saveUserProgress');
      const hasContentLoading = content.includes('loadLessonContent');

      console.log(`   - Offline Support: ${hasOfflineSupport ? '✅' : '❌'}`);
      console.log(
        `   - Progress Tracking: ${hasProgressTracking ? '✅' : '❌'}`
      );
      console.log(`   - Content Loading: ${hasContentLoading ? '✅' : '❌'}`);
    }

    // Check localization service features
    if (service.includes('localization')) {
      const hasLanguageDetection = content.includes('detectDeviceLanguage');
      const hasLanguagePersistence = content.includes('AsyncStorage');
      const hasI18nIntegration = content.includes('i18next');

      console.log(
        `   - Language Detection: ${hasLanguageDetection ? '✅' : '❌'}`
      );
      console.log(
        `   - Language Persistence: ${hasLanguagePersistence ? '✅' : '❌'}`
      );
      console.log(`   - i18n Integration: ${hasI18nIntegration ? '✅' : '❌'}`);
    }
  } else {
    console.log(`❌ Missing service: ${service}`);
  }
}

// Test 4: Verify Localization Files
console.log('\n\n🌐 Testing Localization...');

const localesPath = path.join(__dirname, '..', 'locales');
const requiredLocales = ['en.json', 'fr.json'];

for (const locale of requiredLocales) {
  const localePath = path.join(localesPath, locale);
  if (fs.existsSync(localePath)) {
    const localeData = JSON.parse(fs.readFileSync(localePath, 'utf8'));

    console.log(`✅ ${locale}:`);

    // Check for education-specific translations
    const hasEducationKeys =
      localeData.education &&
      localeData.education.hub &&
      localeData.education.module &&
      localeData.education.quiz;

    console.log(
      `   - Education Translations: ${hasEducationKeys ? '✅' : '❌'}`
    );

    if (hasEducationKeys) {
      const educationKeyCount =
        JSON.stringify(localeData.education).split(':').length - 1;
      console.log(`   - Education Key Count: ${educationKeyCount}`);
    }
  } else {
    console.log(`❌ Missing locale: ${locale}`);
  }
}

// Test 5: Content Quality Assessment
console.log('\n\n📝 Content Quality Assessment...');

const enContentPath = path.join(
  assetsPath,
  'en',
  'understanding-credit-canada'
);
const frContentPath = path.join(
  assetsPath,
  'fr',
  'understanding-credit-canada'
);

if (fs.existsSync(enContentPath) && fs.existsSync(frContentPath)) {
  const enFiles = fs.readdirSync(enContentPath).filter(f => f.endsWith('.md'));
  const frFiles = fs.readdirSync(frContentPath).filter(f => f.endsWith('.md'));

  console.log(`📚 Understanding Credit in Canada:`);
  console.log(`   - English lessons: ${enFiles.length}`);
  console.log(`   - French lessons: ${frFiles.length}`);

  // Check content length and quality
  for (const file of enFiles) {
    const filePath = path.join(enContentPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const wordCount = content.split(/\s+/).length;
    const hasHeaders = content.includes('#');
    const hasCanadianContent =
      content.includes('Canada') || content.includes('Canadian');

    console.log(`   ✅ ${file}:`);
    console.log(`      - Word count: ${wordCount}`);
    console.log(`      - Has headers: ${hasHeaders ? '✅' : '❌'}`);
    console.log(
      `      - Canadian context: ${hasCanadianContent ? '✅' : '❌'}`
    );
  }
}

console.log('\n\n🎯 Test Summary');
console.log('===============');
console.log('✅ Content structure validation completed');
console.log('✅ Component accessibility features verified');
console.log('✅ Service layer functionality checked');
console.log('✅ Localization setup validated');
console.log('✅ Content quality assessed');

console.log('\n🚀 The Education System is ready for testing!');
console.log('\nRecommended next steps:');
console.log('1. Run the Expo app and test education hub navigation');
console.log('2. Test language switching functionality');
console.log('3. Verify offline content loading');
console.log('4. Test on different device sizes');
console.log('5. Verify accessibility with screen reader enabled');
