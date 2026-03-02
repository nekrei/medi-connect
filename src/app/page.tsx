import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-3xl">❤️</span>
              <span className="text-2xl font-bold text-blue-600">MediConnect</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-2 text-blue-600 font-medium hover:text-blue-700 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Your Health,
                  <span className="text-blue-600"> Our Priority</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Connect with experienced doctors, access medical records, and manage your health all in one place. MediConnect brings quality healthcare to your fingertips.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-center"
                >
                  Get Started as Patient
                </Link>
                <Link
                  href="/register?type=doctor"
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition text-center"
                >
                  Join as Doctor
                </Link>
              </div>

              <div className="flex items-center gap-8 text-gray-700 text-sm">
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👥</span>
                  <span>10K+ Users</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-8xl">❤️</p>
                  <p className="text-gray-600 font-medium">Your Health Journey Starts Here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose MediConnect?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive healthcare solutions designed for modern living
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Find Doctors */}
            <div className="p-8 border border-neutral-200 rounded-xl hover:shadow-lg transition">
              <p className="text-5xl mb-4">👨‍⚕️</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Find Trusted Doctors</h3>
              <p className="text-gray-600">
                Browse through verified healthcare professionals with detailed profiles, ratings, and specialties. Find the right doctor for your needs.
              </p>
            </div>

            {/* Feature 2: Digital Prescriptions */}
            <div className="p-8 border border-neutral-200 rounded-xl hover:shadow-lg transition">
              <p className="text-5xl mb-4">💊</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Digital Prescriptions</h3>
              <p className="text-gray-600">
                Receive and manage prescriptions digitally. Easy access to medication details and refill options directly through the app.
              </p>
            </div>

            {/* Feature 3: Medical Records */}
            <div className="p-8 border border-neutral-200 rounded-xl hover:shadow-lg transition">
              <p className="text-5xl mb-4">📋</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Medical Records</h3>
              <p className="text-gray-600">
                Keep all your medical reports, test results, and health history in one secure place. Access anytime, anywhere.
              </p>
            </div>

            {/* Feature 4: Location Services */}
            <div className="p-8 border border-neutral-200 rounded-xl hover:shadow-lg transition">
              <p className="text-5xl mb-4">📍</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Find Nearby Services</h3>
              <p className="text-gray-600">
                Locate nearby clinics, labs, and hospitals with real-time information. Map-based search for easy navigation.
              </p>
            </div>

            {/* Feature 5: 24/7 Access */}
            <div className="p-8 border border-neutral-200 rounded-xl hover:shadow-lg transition">
              <p className="text-5xl mb-4">⏰</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Availability</h3>
              <p className="text-gray-600">
                Access your health information and connect with doctors anytime. Because health doesn't wait for business hours.
              </p>
            </div>

            {/* Feature 6: Secure Platform */}
            <div className="p-8 border border-neutral-200 rounded-xl hover:shadow-lg transition">
              <p className="text-5xl mb-4">🔐</p>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Maximum Security</h3>
              <p className="text-gray-600">
                Your data is encrypted and protected. We follow international healthcare data protection standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section className="py-20 lg:py-32 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="aspect-square bg-white rounded-2xl shadow-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <p className="text-8xl">👩‍⚕️</p>
                  <p className="text-gray-600 font-medium">Grow Your Practice</p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  for Healthcare Professionals
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Expand your reach, manage patients efficiently, and provide better care with MediConnect.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Manage Your Chambers</h4>
                    <p className="text-gray-600">Create and manage multiple chambers/clinics with easy scheduling.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Patient Management System</h4>
                    <p className="text-gray-600">Access your patient database securely and organize records efficiently.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Digital Prescription Issuance</h4>
                    <p className="text-gray-600">Issue prescriptions digitally with integrated medication database.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Grow Your Patient Base</h4>
                    <p className="text-gray-600">Reach thousands of patients looking for healthcare professionals.</p>
                  </div>
                </div>
              </div>

              <Link
                href="/register/doctor"
                className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Join MediConnect as a Doctor →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600 mb-2">10K+</p>
              <p className="text-gray-600 font-medium">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600 mb-2">500+</p>
              <p className="text-gray-600 font-medium">Healthcare Professionals</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600 mb-2">50K+</p>
              <p className="text-gray-600 font-medium">Medical Records Secured</p>
            </div>
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-600 mb-2">99.9%</p>
              <p className="text-gray-600 font-medium">Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-bold">Ready to Get Started?</h2>
            <p className="text-xl text-blue-100">
              Join thousands of users who trust MediConnect for their healthcare needs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              Register as Patient
            </Link>
            <Link
              href="/register/doctor"
              className="px-8 py-4 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 border-2 border-blue-700 transition"
            >
              Join as Doctor
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg hover:bg-blue-700 border-2 border-white transition"
            >
              Existing User? Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">❤️</span>
                <span className="text-white font-bold">MediConnect</span>
              </div>
              <p className="text-sm">Making healthcare accessible to everyone.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Patients</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition">Login</Link></li>
                <li><Link href="/register" className="hover:text-white transition">Register</Link></li>
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Doctors</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/register/doctor" className="hover:text-white transition">Join Now</Link></li>
                <li><a href="#doctors" className="hover:text-white transition">Learn More</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#privacy" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 MediConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
