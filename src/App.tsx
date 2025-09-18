import { useState } from 'react'
import emailjs from '@emailjs/browser'
import AIChatbot from './components/AIChatbot'
// Updated donation section with scrollable options

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // State for accordion sections
  const [expandedSubSections, setExpandedSubSections] = useState<{ [key: string]: boolean }>({});

  // Function to toggle sub-section expansion (only one at a time)
  const toggleSubSection = (subSectionId: string) => {
    setExpandedSubSections(prev => {
      // If clicking the same section that's already open, close it
      if (prev[subSectionId]) {
        return {};
      }
      // Otherwise, close all others and open only this one
      const newState = { [subSectionId]: true };
      
      // Scroll to content area after a brief delay to allow content to render
      setTimeout(() => {
        const contentArea = document.getElementById('info-content-area');
        if (contentArea) {
          contentArea.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
      
      return newState;
    });
  };
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  // Sample testimonials - you can replace these with your actual testimonials
  const testimonials = [
    {
      text: "I had just moved to Pittsburgh and didn't know a soul. That first Shabbat dinner at Shosh and Moshe's home felt like walking into a warm hug. It's not just a meal — it's a family.",
      author: "Tammy",
      role: "Community Member"
    },
    {
      text: "As someone who lives alone and has no family nearby, these dinners are the highlight of my week. The atmosphere, the food, the learning — it brings my heart back to life.",
      author: "Dave",
      role: "Community Member"
    },
    {
      text: "Lev Echad brings people together in a way I've never seen before. Shosh sees each person and makes them feel like they matter.",
      author: "Mordechai",
      role: "Community Member"
    },
    {
      text: "It's hard being a student away from home. I didn't expect to feel this kind of connection around a Shabbat table in someone's house — but I did, and I keep coming back.",
      author: "David",
      role: "Student"
    },
    {
      text: "As an Israeli living far from home, it's easy to feel alone, especially on Shabbat. At the Mash's house, I didn't just meet people, I felt like I found a family. Sitting around the table, singing and sharing stories, I felt seen and loved in a way I didn't expect.",
      author: "Noga",
      role: "Israeli Community Member"
    },
    {
      text: "Lev Echad's help with getting our kids into school made everything so much easier. Shosh connected us directly with the school registrar, and shared so much helpful information that it took all our concerns away. We felt supported from the very beginning.",
      author: "Adam",
      role: "Parent"
    },
    {
      text: "We came to Pittsburgh in complete shock due to our daughter's urgent medical treatment. Everything happened so fast, and we suddenly found ourselves alone, afraid, and barely able to speak English. It was incredibly challenging. Shosh was the first person we reached out to — we got her number from another woman, Tal, whom she had helped in a similar situation. From the moment we connected, I felt like I had family here. Shosh was the first person who truly supported me, and her presence brought us comfort and strength when we needed it most.",
      author: "Avraham",
      role: "Parent"
    },
    {
      text: "Lev Echad helped us find the best care for our baby boy. We were very anxious about the transition — especially worried that the language barrier would make it hard for our son to connect with his teachers since no one spoke Hebrew. Shosh understood our concerns immediately. She supported us through the process, reassured us, and helped us find a place with Hebrew-speaking staff where we feel much more comfortable and at ease.",
      author: "Rafi",
      role: "Parent"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Formspree endpoint
      const formspreeEndpoint = 'https://formspree.io/f/xyzdnyww';
      
      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          _subject: `New message from ${formData.name} - Lev Echad Contact Form`,
        }),
      });

      if (response.ok) {
        console.log('Email sent successfully!');
        
        // Send copy to user using EmailJS
        try {
          // Initialize EmailJS with your service ID
          emailjs.init('9uN_4d08ybrG6_IhR');
          
          const templateParams = {
            to_name: formData.name,
            to_email: formData.email,
            from_name: 'Lev Echad',
            message: formData.message,
            reply_to: 'mashshosh@gmail.com',
            user_name: formData.name,
            user_email: formData.email,
            user_message: formData.message
          };

          console.log('Sending EmailJS copy with params:', templateParams);
          
          const result = await emailjs.send(
            'service_l47oh6c',
            'template_3a68j0o',
            templateParams
          );
          
          console.log('EmailJS result:', result);
          console.log('Copy sent to user successfully!');
        } catch (emailError) {
          console.error('Error sending copy to user:', emailError);
          console.error('EmailJS error details:', emailError);
          // Don't fail the whole form if the copy fails
        }
        
        setIsSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ name: '', email: '', message: '' });
        }, 3000);
      } else {
        throw new Error('Failed to send message');
      }

    } catch (error) {
      console.error('Error sending email:', error);
      alert('Sorry, there was an error sending your message. Please try again or contact us directly at mashshosh@gmail.com');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 border-b border-blue-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="./logo.jpg" alt="Lev Echad Logo" className="h-12 w-12 rounded-full object-cover shadow-lg" />
            <div className="leading-tight">
              <div className="text-lg font-bold text-blue-900">Lev Echad</div>
              <div className="text-xs text-blue-600">A Home Away from Home</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#get-information" className="hover:text-blue-700 transition-colors">Get Information</a>
            <a href="#programs" className="hover:text-blue-700 transition-colors">Programs</a>
            <a href="#events" className="hover:text-blue-700 transition-colors">Events</a>
            <a href="#about" className="hover:text-blue-700 transition-colors">About</a>
            <a href="#contact" className="hover:text-blue-700 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="#events" className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 inline-block text-center transition-colors">
              Join Events
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2 md:py-24 relative z-10">
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              A Home Away from Home for Jewish and Israeli Pittsburghers
            </h1>
            <p className="mt-5 text-lg text-blue-100">
              Founded by Shosh Mash, an Israeli mother, educator, and community builder, Lev Echad reflects the power of feeling truly welcomed.
            </p>
            <p className="mt-4 text-lg text-blue-100">
              Through intimate Shabbat dinners, we create space for connection, emotional support, cultural identity, and lasting friendships.
            </p>
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-sm text-white font-medium text-left">
                <strong>Important Notice:</strong> Lev Echad is a community and personal-friendly organization that operates on a not-for-profit basis. All help provided is friendly and not professional. We are committed to serving our community through personal connections and support.
              </p>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="max-w-lg w-full">
              <div className="bg-white rounded-2xl p-8 shadow-2xl border border-blue-200">
                <div className="text-center">
                  <div className="text-4xl text-blue-600 mb-4">💙</div>
                  <blockquote className="text-lg text-blue-900 italic mb-6 leading-relaxed">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  <div className="text-blue-800">
                    <p className="font-semibold">{testimonials[currentTestimonial].author}</p>
                    <p className="text-sm opacity-80">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
                
                {/* Navigation arrows */}
                <div className="flex justify-between items-center mt-6">
                  <button 
                    onClick={prevTestimonial}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50"
                    aria-label="Previous testimonial"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="flex space-x-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTestimonial(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentTestimonial ? 'bg-blue-600' : 'bg-blue-300'
                        }`}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  <button 
                    onClick={nextTestimonial}
                    className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50"
                    aria-label="Next testimonial"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Information Section */}
      <section id="get-information" className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Welcome to Pittsburgh!</h2>
            <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-medium">
              Your friendly guide to Jewish life in Pittsburgh. Click on any topic below to explore detailed information!
            </p>
          </div>

          {/* Single Main Information Card */}
          <div className="bg-white border-2 border-blue-200 rounded-3xl p-10 shadow-2xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Choose a Topic to Explore</h3>
              <p className="text-lg text-gray-600">Click on any category below to see detailed, helpful information</p>
            </div>
            
            {/* Category Selection Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <button 
                onClick={() => toggleSubSection('schools')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  expandedSubSections.schools 
                    ? 'border-blue-400 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🎓</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Jewish Schools</h4>
                  <p className="text-sm text-gray-600">Find the perfect school for your children</p>
                </div>
              </button>

              <button 
                onClick={() => toggleSubSection('neighborhoods')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  expandedSubSections.neighborhoods 
                    ? 'border-green-400 bg-green-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🏘️</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Neighborhoods</h4>
                  <p className="text-sm text-gray-600">Discover where to live and what to expect</p>
                </div>
              </button>

              <button 
                onClick={() => toggleSubSection('synagogues')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  expandedSubSections.synagogues 
                    ? 'border-purple-400 bg-purple-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🕍</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Synagogues (Shuls)</h4>
                  <p className="text-sm text-gray-600">Find your spiritual community home</p>
                </div>
              </button>

              <button 
                onClick={() => toggleSubSection('kosher')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  expandedSubSections.kosher 
                    ? 'border-orange-400 bg-orange-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🍽️</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Kosher Food</h4>
                  <p className="text-sm text-gray-600">Restaurants, groceries, and dining options</p>
                </div>
              </button>

              <button 
                onClick={() => toggleSubSection('shopping')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  expandedSubSections.shopping 
                    ? 'border-pink-400 bg-pink-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🛍️</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Shopping & Malls</h4>
                  <p className="text-sm text-gray-600">Malls, outlets, and shopping centers</p>
                </div>
              </button>

              <button 
                onClick={() => toggleSubSection('healthcare')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  expandedSubSections.healthcare 
                    ? 'border-red-400 bg-red-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-red-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🏥</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Healthcare</h4>
                  <p className="text-sm text-gray-600">Doctors, hospitals, and medical care</p>
                </div>
              </button>

              <button 
                onClick={() => toggleSubSection('transportation')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  expandedSubSections.transportation 
                    ? 'border-yellow-400 bg-yellow-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-yellow-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🚌</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Transportation</h4>
                  <p className="text-sm text-gray-600">Getting around Pittsburgh</p>
                </div>
              </button>

              <button 
                onClick={() => toggleSubSection('banking')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  expandedSubSections.banking 
                    ? 'border-emerald-400 bg-emerald-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🏦</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Banking</h4>
                  <p className="text-sm text-gray-600">Banks and financial services</p>
                </div>
              </button>

              <button 
                onClick={() => toggleSubSection('immigration')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                  expandedSubSections.immigration 
                    ? 'border-cyan-400 bg-cyan-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-cyan-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Immigration & Relocation</h4>
                  <p className="text-sm text-gray-600">Government offices and relocation help</p>
                </div>
              </button>
            </div>

            {/* Content Area for Selected Category */}
            <div id="info-content-area" className="min-h-[400px]">
              {/* Schools Content */}
              {expandedSubSections.schools && (
                <div className="bg-blue-50 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-3xl font-bold text-blue-900 mb-6 flex items-center">
                    <span className="text-4xl mr-4">🎓</span>
                    Jewish Schools in Pittsburgh
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
                      <h4 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🏫</span>
                        Full Jewish Schools (K-12)
                      </h4>
            <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.comday.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Community Day School (CDS)</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">Ages 2 through Grade 8 • No high school program</p>
                          <p className="text-base text-blue-600 mb-4">Pluralistic school welcoming Jewish families of all backgrounds. Focus on Jewish identity, Hebrew, holidays, and strong academics. Boys and girls learn together in all classes.</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.hillelpgh.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Hillel Academy</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">Infants through High School • Full K-12 program</p>
                          <p className="text-base text-blue-600 mb-4">Modern Orthodox school with strong Kodesh (Jewish studies) and secular academics. Co-ed until 3rd grade, then separate classes from 4th grade onward.</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.yeshivaschools.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Yeshiva Schools</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">Infants through High School • Full boys' and girls' programs</p>
                          <p className="text-base text-blue-600 mb-4">Chabad philosophy school with strong Jewish studies. Early childhood is very welcoming, then separate classes from kindergarten with increased Chabad focus.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-100 rounded-xl p-6 border-l-4 border-green-500">
                      <h4 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">👶</span>
                        Early Childhood Only
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">
                            <a href="https://jccpgh.org/early-childhood-education/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">JCC Early Childhood</a>
                          </h5>
                          <p className="text-lg text-green-700 mb-3">Ages 2 through Kindergarten only</p>
                          <p className="text-base text-green-600 mb-4">Jewish values-based preschool program with no elementary or higher grades. Great foundation for Jewish learning!</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">
                            <a href="https://bethshalompgh.org/early-learning/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Beth Shalom Early Learning Center</a>
                          </h5>
                          <p className="text-lg text-green-700 mb-3">Ages 2 through Kindergarten only</p>
                          <p className="text-base text-green-600 mb-4">Conservative-affiliated program located inside Congregation Beth Shalom. Warm, nurturing environment.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-100 rounded-xl p-6 border-l-4 border-orange-500">
                      <h4 className="text-2xl font-bold text-orange-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🏫</span>
                        Public School Option
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-orange-800 mb-3">
                            <a href="https://www.pghschools.org/colfax" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Colfax Public School</a>
                          </h5>
                          <p className="text-lg text-orange-700 mb-3">Kindergarten through 8th Grade • Local Squirrel Hill school</p>
                          <p className="text-base text-orange-600 mb-4">Excellent public school welcoming all families from the neighborhood. Many Jewish families choose this option and supplement with Hebrew school.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-xl p-6 border border-yellow-300">
                      <p className="text-xl text-yellow-800 text-center font-medium flex items-center justify-center">
                        <span className="text-3xl mr-3">💡</span>
                        Many families visit schools before deciding. Most schools welcome prospective families for tours and meetings!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Synagogues Content */}
              {expandedSubSections.synagogues && (
                <div className="bg-purple-50 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-3xl font-bold text-purple-900 mb-6 flex items-center">
                    <span className="text-4xl mr-4">🕍</span>
                    Synagogues (Shuls) in Pittsburgh
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-purple-100 rounded-xl p-6 border-l-4 border-purple-500">
                      <h4 className="text-2xl font-bold text-purple-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🕯️</span>
                        Chabad - Very Welcoming!
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">
                            <a href="https://www.lubavitchcenter.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Lubavitch Center</a>
                          </h5>
                          <p className="text-lg text-purple-700 mb-3">Main Chabad community shul run by Rabbi Rosenfeld, the main Shliach of Western Pennsylvania - very welcoming and serves as central hub for Chabad families</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">
                            <a href="https://www.chabadpgh.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Chabad of Squirrel Hill</a>
                          </h5>
                          <p className="text-lg text-purple-700 mb-3">Warm center for Jews connecting with Jewish life. Rabbi Altein speaks Hebrew - perfect for Israeli families! Kids' programs, holiday celebrations, summer camps.</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">Keser Torah</h5>
                          <p className="text-lg text-purple-700 mb-3">Beautiful Chabad synagogue run by Rabbi Rosenblum (Yeshiva Schools CEO) with warm community and engaging programs for all ages</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">
                            <a href="https://www.bechabad.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">B'nai Emunoh (Greenfield)</a>
                          </h5>
                          <p className="text-lg text-purple-700 mb-3">Main Jewish center in Greenfield with daily services, adult education, women's & children's programs</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">Baal Shem Tov Shul</h5>
                          <p className="text-lg text-purple-700 mb-3">A small shul with a shtibel vibe - very welcoming and warm Chabad shul with an intimate, homey atmosphere</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
                      <h4 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">📚</span>
                        Orthodox & Modern Orthodox
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.shaaretorah.net/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Shaare Torah</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">Modern Orthodox synagogue with strong family atmosphere, daily minyanim, vibrant youth programming, and active adult learning opportunities</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.poalezedeck.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Poale Zedeck</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">Cornerstone of the Modern Orthodox community in Pittsburgh with daily services, shiurim, and strong youth engagement</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.youngisraelpgh.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Young Israel</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">Smaller, close-knit Orthodox community - very welcoming to newcomers with intimate feel</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.kollelpgh.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">The Kollel</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">Torah study center & shul with chavruta programs, women's classes, and community lectures</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-100 rounded-xl p-6 border-l-4 border-green-500">
                      <h4 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🎵</span>
                        Conservative & Reform
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">
                            <a href="https://www.bethshalompgh.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Beth Shalom (Conservative)</a>
                          </h5>
                          <p className="text-lg text-green-700 mb-3">Large Conservative synagogue with services, youth programs, adult learning - historic presence in Pittsburgh</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">
                            <a href="https://www.templesinaipgh.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Temple Sinai (Reform)</a>
                          </h5>
                          <p className="text-lg text-green-700 mb-3">Inclusive, music-rich community focused on social justice and extensive programming</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">
                            <a href="https://www.rodefshalom.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Rodef Shalom (Reform)</a>
                          </h5>
                          <p className="text-lg text-green-700 mb-3">One of the oldest Reform congregations in the U.S. with beautiful architecture and cultural programs</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-xl p-6 border border-yellow-300">
                      <p className="text-xl text-yellow-800 text-center font-medium flex items-center justify-center">
                        <span className="text-3xl mr-3">💡</span>
                        Most synagogues offer Shabbat Kiddush after Saturday morning services — a wonderful way for newcomers to meet people and feel welcomed into the community!
              </p>
            </div>
                  </div>
                </div>
              )}

              {/* Neighborhoods Content */}
              {expandedSubSections.neighborhoods && (
                <div className="bg-green-50 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-3xl font-bold text-green-900 mb-6 flex items-center">
                    <span className="text-4xl mr-4">🏘️</span>
                    Jewish Neighborhoods in Pittsburgh
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-green-100 rounded-xl p-6 border-l-4 border-green-500">
                      <h4 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🏠</span>
                        Heart of Jewish Life
                      </h4>
            <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">Squirrel Hill - The Center!</h5>
                          <p className="text-lg text-green-700 mb-3">Heart of Jewish life in Pittsburgh • Everything walkable!</p>
                          <p className="text-base text-green-600">Dozens of synagogues, kosher restaurants, and groceries. Family-friendly with <a href="https://www.pittsburghpa.gov/parks/schenley" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">parks</a>, <a href="https://www.carnegielibrary.org/locations/squirrel-hill/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">libraries</a>, and <a href="https://jccpgh.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">community centers</a>. Mix of apartments, duplexes, and single-family homes. Higher prices due to strong demand, but most families who want walking distance to shuls and schools live here.</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">Greenfield - Great Value Nearby!</h5>
                          <p className="text-lg text-green-700 mb-3">Affordable alternative right next to Squirrel Hill • 5-10 minutes away</p>
                          <p className="text-base text-green-600">Many Jewish families live here with easy access to Squirrel Hill's Jewish infrastructure. More affordable, mostly single-family homes and duplexes. Not as walkable to shuls or kosher stores, but very close by <a href="https://www.rideprt.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">car or bus</a>.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
                      <h4 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🎓</span>
                        Students & Young Professionals
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">Shadyside - Near Hospitals & Universities</h5>
                          <p className="text-lg text-blue-700 mb-3">Popular with students, young professionals, and medical staff</p>
                          <p className="text-base text-blue-600">Close to <a href="https://www.upmc.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">UPMC hospitals</a> and universities. Mix of apartments and historic houses; tends to be pricier. Not as strong Jewish presence as Squirrel Hill, but very convenient for <a href="https://www.cmu.edu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">CMU</a>/<a href="https://www.pitt.edu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">Pitt</a> students and hospital workers.</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">Oakland (Universities Area)</h5>
                          <p className="text-lg text-blue-700 mb-3">Mainly students, academics, and medical residents</p>
                          <p className="text-base text-blue-600">Quick 5-10 minute <a href="https://www.rideprt.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">bus ride</a> to Squirrel Hill. Limited Jewish infrastructure in Oakland itself, but close enough to easily walk, bike, or bus into Squirrel Hill for Jewish life.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-100 rounded-xl p-6 border-l-4 border-purple-500">
                      <h4 className="text-2xl font-bold text-purple-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🌳</span>
                        Quiet Family Neighborhoods
                      </h4>
            <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">Regent Square / Edgewood</h5>
                          <p className="text-lg text-purple-700 mb-3">Charming, quieter neighborhoods • 10-15 minute drive to Squirrel Hill</p>
                          <p className="text-base text-purple-600">Mix of families and professionals. More affordable than Squirrel Hill with tree-lined streets and <a href="https://www.pittsburghpa.gov/parks/frick" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">parks</a>. Small Jewish presence, but families sometimes choose it for affordability and quiet family life.</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">
                            <a href="https://www.mtlebanon.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Mt. Lebanon (South Hills)</a>
                          </h5>
                          <p className="text-lg text-purple-700 mb-3">Larger suburban community • 20-25 minutes from Squirrel Hill</p>
                          <p className="text-base text-purple-600">Has some Jewish families and synagogues but not walkable like Squirrel Hill. Excellent <a href="https://www.mtlsd.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">public schools</a> and strong family-friendly suburban vibe. Good choice for families wanting suburban lifestyle.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-xl p-6 border border-yellow-300">
                      <p className="text-xl text-yellow-800 text-center font-medium flex items-center justify-center">
                        <span className="text-3xl mr-3">💡</span>
                        Most families start by visiting Squirrel Hill to see the Jewish community, then explore nearby neighborhoods based on budget and lifestyle preferences!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Kosher Food Content */}
              {expandedSubSections.kosher && (
                <div className="bg-orange-50 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-3xl font-bold text-orange-900 mb-6 flex items-center">
                    <span className="text-4xl mr-4">🍽️</span>
                    Kosher Food & Groceries
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-orange-100 rounded-xl p-6 border-l-4 border-orange-500">
                      <h4 className="text-2xl font-bold text-orange-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🛒</span>
                        Kosher Supermarket & Stores
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-orange-800 mb-3">
                            <a href="https://www.murrayavenuekoshersupermarket.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Murray Avenue Kosher</a>
                          </h5>
                          <p className="text-lg text-orange-700 mb-3">Full kosher supermarket offering meat, poultry, deli, bakery, packaged goods, and Israeli products</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-orange-800 mb-3">
                            <a href="https://www.pinskersjudaica.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Pinsker's Judaica & Wines</a>
                          </h5>
                          <p className="text-lg text-orange-700 mb-3">Judaica store with a large kosher wine selection (same building as Eighteen)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-100 rounded-xl p-6 border-l-4 border-red-500">
                      <h4 className="text-2xl font-bold text-red-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🍕</span>
                        Kosher Restaurants
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-red-800 mb-3">
                            <a href="https://www.milkywaypgh.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Milky Way (Dairy)</a>
                          </h5>
                          <p className="text-lg text-red-700 mb-3">Kosher dairy restaurant serving pizza, pasta, falafel, and other family-friendly meals</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-red-800 mb-3">
                            <a href="https://cafeeighteen.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Eighteen (Meat)</a>
                          </h5>
                          <p className="text-lg text-red-700 mb-3">Strictly kosher meat restaurant, also offering sushi and grill options</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-red-800 mb-3">
                            <a href="https://bunnybakes.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Bunny Bakes & Specialty Coffee</a>
                          </h5>
                          <p className="text-lg text-red-700 mb-3">Kosher bakery-café offering pastries, baked goods, and specialty coffee drinks</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-red-800 mb-3">
                            <a href="https://eedgecatering.square.site/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Edge Catering</a>
                          </h5>
                          <p className="text-lg text-red-700 mb-3">Kosher catering and restaurant near CMU - convenient for university students and staff</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
                      <h4 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🏪</span>
                        Mainstream Stores with Kosher Options
                      </h4>
                      <p className="text-lg text-blue-700 mb-4">Check labels and supervision at these stores:</p>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <a href="https://www.gianteagle.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-lg underline hover:no-underline transition-all duration-200">Giant Eagle</a>
                            <a href="https://www.traderjoes.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-lg underline hover:no-underline transition-all duration-200">Trader Joe's</a>
                            <a href="https://www.wholefoodsmarket.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-lg underline hover:no-underline transition-all duration-200">Whole Foods</a>
                            <a href="https://www.costco.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-lg underline hover:no-underline transition-all duration-200">Costco</a>
                            <a href="https://www.aldi.us/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-lg underline hover:no-underline transition-all duration-200">ALDI</a>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-xl p-6 border border-yellow-300">
                      <p className="text-xl text-yellow-800 text-center font-medium flex items-center justify-center">
                        <span className="text-3xl mr-3">💡</span>
                        Always check kosher certification and supervision when shopping at mainstream stores!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {expandedSubSections.shopping && (
                <div className="bg-pink-50 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-3xl font-bold text-pink-900 mb-6 flex items-center">
                    <span className="text-4xl mr-4">🛍️</span>
                    Shopping & Malls
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-pink-100 rounded-xl p-6 border-l-4 border-pink-500">
                      <h4 className="text-2xl font-bold text-pink-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🏪</span>
                        Closest Shopping (~10-15 min)
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-pink-800 mb-3">
                            <a href="https://www.waterfrontpgh.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">The Waterfront (Homestead)</a>
                          </h5>
                          <p className="text-lg text-pink-700 mb-3">~10 minutes from Squirrel Hill</p>
                          <p className="text-base text-pink-600">Target, Walmart, Lowe's, Old Navy, Bath & Body Works, Barnes & Noble, AMC Theater, and many restaurants</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-pink-800 mb-3">
                            <a href="https://southsideworks.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">SouthSide Works</a>
                          </h5>
                          <p className="text-lg text-pink-700 mb-3">~15 minutes away</p>
                          <p className="text-base text-pink-600">Urban-style shopping and dining area with boutiques, restaurants, movie theater, and fitness studios</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
                      <h4 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🏬</span>
                        Major Malls (~20-30 min)
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.shopmonroevillemall.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Monroeville Mall</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">~20 minutes from Squirrel Hill</p>
                          <p className="text-base text-blue-600">Full indoor mall with Macy's, JCPenney, Dick's Sporting Goods, H&M, American Eagle, Apple Store, Sephora, and a food court</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.simon.com/mall/ross-park-mall" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Ross Park Mall (North Hills)</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">~30 minutes by car</p>
                          <p className="text-base text-blue-600">Upscale indoor mall with Nordstrom, Macy's, Apple, Coach, Michael Kors, Lululemon, Sephora, and more</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.shoprobinsonmall.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Robinson Mall</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">~25-30 minutes from Squirrel Hill</p>
                          <p className="text-base text-blue-600">Large mall near Costco and IKEA, with Macy's, JCPenney, Dick's Sporting Goods, Best Buy, H&M, Barnes & Noble</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-100 rounded-xl p-6 border-l-4 border-purple-500">
                      <h4 className="text-2xl font-bold text-purple-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🏷️</span>
                        Outlet Shopping (~40 min - 1 hr)
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">
                            <a href="https://www.tangeroutlet.com/pittsburgh" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Tanger Outlets (Washington, PA)</a>
                          </h5>
                          <p className="text-lg text-purple-700 mb-3">~40 minutes south of Pittsburgh</p>
                          <p className="text-base text-purple-600">Nike, Adidas, Polo Ralph Lauren, Gap, Banana Republic, Under Armour, Coach, Michael Kors, often with big sales</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">
                            <a href="https://www.premiumoutlets.com/outlet/grove-city" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Grove City Premium Outlets</a>
                          </h5>
                          <p className="text-lg text-purple-700 mb-3">~1 hour north of Pittsburgh</p>
                          <p className="text-base text-purple-600">One of the largest outlet malls in the region. Kate Spade, Tory Burch, Columbia, Levi's, Disney, and many others</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-purple-800 mb-3">
                            <a href="https://www.ikea.com/us/en/stores/pittsburgh/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">IKEA Pittsburgh (Robinson)</a>
                          </h5>
                          <p className="text-lg text-purple-700 mb-3">Next to Robinson Mall</p>
                          <p className="text-base text-purple-600">Very popular for furniture, home goods, and kitchen essentials</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-xl p-6 border border-yellow-300">
                      <p className="text-xl text-yellow-800 text-center font-medium flex items-center justify-center">
                        <span className="text-3xl mr-3">💡</span>
                        The Waterfront is closest for everyday shopping, while outlet malls are great for weekend trips and deals!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {expandedSubSections.healthcare && (
                <div className="bg-red-50 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-3xl font-bold text-red-900 mb-6 flex items-center">
                    <span className="text-4xl mr-4">🏥</span>
                    Healthcare & Medical Services
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-red-100 rounded-xl p-6 border-l-4 border-red-500">
                      <h4 className="text-2xl font-bold text-red-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">👶</span>
                        Pediatricians & Primary Care
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-red-800 mb-3">
                            <a href="https://www.childrenspeds.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">UPMC Children's Community Pediatrics – Bass Wolfson</a>
                          </h5>
                          <p className="text-lg text-red-700 mb-3">Squirrel Hill Office</p>
                          <p className="text-base text-red-600">Major pediatric provider serving infants through teens. Offers primary care, well-child visits, immunizations, express care, and many pediatric specialists</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-red-800 mb-3">
                            <a href="https://kidspluspgh.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Kids Plus Pediatrics</a>
                          </h5>
                          <p className="text-lg text-red-700 mb-3">Squirrel Hill / Greenfield</p>
                          <p className="text-base text-red-600">Full pediatric care including newborn care, immunizations, behavioral health, nutrition & fitness. Accepts all major insurances</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-red-800 mb-3">
                            <a href="https://www.ahn.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Squirrel Hill Primary Care (AHN)</a>
                          </h5>
                          <p className="text-lg text-red-700 mb-3">General primary care</p>
                          <p className="text-base text-red-600">Includes pediatric services. Good option for routine checkups with family doctors</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
                      <h4 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🚑</span>
                        Urgent Care & Emergency
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://steelvalleyexpresscare.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Steel Valley Express Care</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">Open 7 days</p>
                          <p className="text-base text-blue-600">Walk-in urgent care for non-emergency medical needs when your pediatrician isn't available (illness, minor injuries, etc.)</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">
                            <a href="https://www.ahn.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">AHN Urgent & Express Care</a>
                          </h5>
                          <p className="text-lg text-blue-700 mb-3">Multiple locations around Pittsburgh</p>
                          <p className="text-base text-blue-600">Care for minor illnesses/injuries, diagnostic services, X-ray, etc. Useful when you can't wait for a pediatrician</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-100 rounded-xl p-6 border-l-4 border-green-500">
                      <h4 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🏥</span>
                        Major Hospitals
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">
                            <a href="https://www.upmc.com/locations/hospitals/shadyside" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">UPMC Shadyside</a>
                          </h5>
                          <p className="text-lg text-green-700 mb-3">Large teaching hospital in the UPMC system</p>
                          <p className="text-base text-green-600">Emergency services, many medical and surgical specialties, cancer care via the Hillman Cancer Center. Very close and well-regarded</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">
                            <a href="https://www.upmc.com/locations/hospitals/magee?utm_source=google&utm_medium=organic&utm_campaign=business-profile&utm_content=hospital-swpa-upmc-magee-womens-hospital" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">UPMC Magee-Womens Hospital</a>
                          </h5>
                          <p className="text-lg text-green-700 mb-3">National Center of Excellence in Women's Health specializing in obstetrics, gynecology, and comprehensive women's care</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">
                            <a href="https://www.ahn.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">West Penn Hospital</a>
                          </h5>
                          <p className="text-lg text-green-700 mb-3">Part of Allegheny Health Network</p>
                          <p className="text-base text-green-600">Known for pregnancy and newborn services, stroke care, neurological care, women's health programs</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">
                            <a href="https://www.chp.edu/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">UPMC Children's Hospital of Pittsburgh</a>
                          </h5>
                          <p className="text-lg text-green-700 mb-3">Specializes in pediatric care</p>
                          <p className="text-base text-green-600">For children's emergencies, specialists, etc. Has community pediatric outpatient facilities as well (e.g. Bass Wolfson office in Squirrel Hill)</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-100 rounded-xl p-6 border-l-4 border-purple-500">
                      <h4 className="text-2xl font-bold text-purple-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">💊</span>
                        Pharmacies Near Squirrel Hill / Greenfield
                      </h4>
                      <div className="space-y-6">
                        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-400">
                          <h5 className="text-xl font-semibold text-green-800 mb-4">🕐 24/7 Emergency Pharmacies</h5>
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <p className="text-lg text-green-700 font-medium mb-2">⚠️ Important Note</p>
                            <p className="text-base text-green-600 mb-2">Most pharmacies in Squirrel Hill/Greenfield area operate standard hours (8 AM - 10 PM).</p>
                            <p className="text-base text-green-600 mb-2">For 24/7 pharmacy needs, you may need to travel to nearby areas:</p>
                            <div className="text-sm text-green-600 space-y-1 ml-4">
                              <p>• Some CVS locations in Pittsburgh metro area are 24/7</p>
                              <p>• Some Rite Aid locations may have extended hours</p>
                              <p>• Hospital pharmacies for emergencies</p>
                              <p className="font-medium text-green-700">📞 Call ahead to confirm current 24/7 availability</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                          <h5 className="text-xl font-semibold text-purple-800 mb-4">🏪 Major Chain Pharmacies</h5>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="text-lg text-purple-700 font-medium mb-2">Walgreens</p>
                              <div className="text-base text-purple-600 space-y-1">
                                <p>📍 5956 Centre Ave, Pittsburgh, PA 15206</p>
                                <p className="text-sm text-gray-600">⏰ Standard hours (8 AM - 10 PM)</p>
                                <p>📍 7628 Penn Ave, Pittsburgh, PA 15221</p>
                                <p className="text-sm text-gray-600">⏰ Standard hours (8 AM - 10 PM)</p>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="text-lg text-purple-700 font-medium mb-2">CVS Pharmacy</p>
                              <div className="text-base text-purple-600 space-y-1">
                                <p>📍 5600 Wilkins Ave, Pittsburgh, PA 15217</p>
                                <p className="text-sm text-gray-600">⏰ Standard hours (8 AM - 10 PM)</p>
                                <p>📍 4664 Browns Hill Rd, Pittsburgh, PA 15217</p>
                                <p className="text-sm text-gray-600">⏰ Standard hours (8 AM - 10 PM)</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                          <h5 className="text-xl font-semibold text-purple-800 mb-4">🏥 Specialty & Independent Pharmacies</h5>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="text-lg text-purple-700 font-medium mb-2">Murray Avenue Apothecary</p>
                              <p className="text-base text-purple-600">📍 4227 Murray Ave, Pittsburgh, PA 15217</p>
                              <p className="text-sm text-purple-500">Holistic health & compounding pharmacy</p>
                              <p className="text-sm text-gray-600">⏰ Standard business hours</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="text-lg text-purple-700 font-medium mb-2">Forbes Pharmacy</p>
                              <p className="text-base text-purple-600">📍 3501 Forbes Ave, Pittsburgh, PA 15213</p>
                              <p className="text-sm text-purple-500">Near Oakland/Pitt campus</p>
                              <p className="text-sm text-gray-600">⏰ Standard business hours</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="text-lg text-purple-700 font-medium mb-2">Hillman Pharmacy</p>
                              <p className="text-base text-purple-600">📍 5115 Centre Ave, Pittsburgh, PA 15232</p>
                              <p className="text-sm text-purple-500">Shadyside area</p>
                              <p className="text-sm text-gray-600">⏰ Standard business hours</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <p className="text-lg text-purple-700 font-medium mb-2">UPMC Magee Outpatient Pharmacy</p>
                              <p className="text-base text-purple-600">📍 300 Halket St, Pittsburgh, PA 15213</p>
                              <p className="text-sm text-purple-500">Hospital-based pharmacy</p>
                              <p className="text-sm text-gray-600">⏰ Mon-Fri: 8 AM - 6 PM</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                          <h5 className="text-xl font-semibold text-purple-800 mb-4">🛒 Grocery Store Pharmacies</h5>
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <p className="text-lg text-purple-700 font-medium mb-2">Giant Eagle Pharmacies</p>
                            <div className="text-base text-purple-600 space-y-1">
                              <p>📍 Multiple locations in Squirrel Hill and surrounding areas</p>
                              <p className="text-sm text-gray-600">⏰ Typical hours: 9 AM - 9 PM (varies by location)</p>
                              <p className="text-sm text-purple-500">❌ Not 24/7 - Check individual store locations for specific pharmacy hours</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-xl p-6 border border-yellow-300">
                      <p className="text-xl text-yellow-800 text-center font-medium flex items-center justify-center">
                        <span className="text-3xl mr-3">💡</span>
                        Register with a pediatrician early. For non-emergencies when offices are closed, urgent care can help. Always check your insurance network!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {expandedSubSections.transportation && (
                <div className="bg-yellow-50 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-3xl font-bold text-yellow-900 mb-6 flex items-center">
                    <span className="text-4xl mr-4">🚌</span>
                    Transportation & Getting Around
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-yellow-100 rounded-xl p-6 border-l-4 border-yellow-500">
                      <h4 className="text-2xl font-bold text-yellow-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🚍</span>
                        Public Transit
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-yellow-800 mb-3">
                            <a href="https://www.rideprt.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Pittsburgh Regional Transit (PRT)</a>
                          </h5>
                          <p className="text-lg text-yellow-700 mb-3">Single ride: $2.75 (cash or ConnectCard)</p>
                          <p className="text-base text-yellow-600">Passes available (day, week, month) • Transfers valid for 3 hours • ConnectCard can be purchased at <a href="https://www.gianteagle.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline hover:no-underline transition-all duration-200">Giant Eagle</a> at the service desk</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
                      <h4 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🚗</span>
                        Driving & Parking
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">Parking in Squirrel Hill / Greenfield</h5>
                          <p className="text-lg text-blue-700 mb-3">Metered parking on Murray/Forbes: ~$2/hr, Mon-Sat, 8am-6pm</p>
                          <p className="text-base text-blue-600">Free after 6pm and all day Sunday • Some residential permit zones (check signs carefully)</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">Ride-Share / Taxi</h5>
                          <p className="text-lg text-blue-700 mb-3">Uber and Lyft widely available</p>
                          <p className="text-base text-blue-600">Taxis (zTrip, Yellow Cab) still operate but are less common</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-100 rounded-xl p-6 border-l-4 border-green-500">
                      <h4 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🚴</span>
                        Biking
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-green-800 mb-3">Safe & Popular Option</h5>
                          <p className="text-lg text-green-700 mb-3">Safe and popular in Squirrel Hill/Greenfield thanks to bike lanes and trails</p>
                          <p className="text-base text-green-600">Best on streets with marked bike lanes. Helmets, lights, and extra caution on hills are strongly recommended</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-xl p-6 border border-yellow-300">
                      <p className="text-xl text-yellow-800 text-center font-medium flex items-center justify-center">
                        <span className="text-3xl mr-3">💡</span>
                        Public transit is great for getting around the city, while biking is perfect for the local Squirrel Hill area!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {expandedSubSections.banking && (
                <div className="bg-emerald-50 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-3xl font-bold text-emerald-900 mb-6 flex items-center">
                    <span className="text-4xl mr-4">🏦</span>
                    Banking Options in Squirrel Hill / Greenfield
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-emerald-100 rounded-xl p-6 border-l-4 border-emerald-500">
                      <h4 className="text-2xl font-bold text-emerald-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🏛️</span>
                        Local Bank Branches
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <div className="grid md:grid-cols-1 gap-4">
                            <div>
                              <h5 className="text-lg font-semibold text-emerald-800 mb-2">
                                <a href="https://www.pnc.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">PNC Bank</a>
                              </h5>
                              <p className="text-base text-emerald-600">5810 Forbes Avenue, Pittsburgh, PA 15217</p>
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold text-emerald-800 mb-2">
                                <a href="https://www.dollar.bank/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Dollar Bank</a>
                              </h5>
                              <p className="text-base text-emerald-600">5822 Forbes Avenue, Pittsburgh, PA 15217</p>
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold text-emerald-800 mb-2">
                                <a href="https://www.key.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">KeyBank</a>
                              </h5>
                              <p className="text-base text-emerald-600">1730 Murray Avenue, Pittsburgh, PA 15217</p>
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold text-emerald-800 mb-2">
                                <a href="https://locations.citizensbank.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Citizens Bank</a>
                              </h5>
                              <p className="text-base text-emerald-600">1801 Murray Avenue, Pittsburgh, PA 15217</p>
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold text-emerald-800 mb-2">
                                <a href="https://www.fnb-online.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">First National Bank</a>
                              </h5>
                              <p className="text-base text-emerald-600">503 Greenfield Avenue (Greenfield) • 1940 Murray Avenue (Squirrel Hill)</p>
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold text-emerald-800 mb-2">
                                <a href="https://www.huntington.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Huntington Bank</a>
                              </h5>
                              <p className="text-base text-emerald-600">5823 Forbes Avenue, Pittsburgh, PA 15217</p>
                            </div>
                            <div>
                              <h5 className="text-lg font-semibold text-emerald-800 mb-2">
                                <a href="https://www.stbank.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200">Squirrel Hill Financial (S&T Bank)</a>
                              </h5>
                              <p className="text-base text-emerald-600">6306 Forbes Avenue, Pittsburgh, PA 15217</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-xl p-6 border border-yellow-300">
                      <p className="text-xl text-yellow-800 text-center font-medium flex items-center justify-center">
                        <span className="text-3xl mr-3">💡</span>
                        Most banks are conveniently located on Forbes Avenue and Murray Avenue in the heart of Squirrel Hill!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {expandedSubSections.immigration && (
                <div className="bg-cyan-50 rounded-2xl p-8 animate-in slide-in-from-top-4 duration-300">
                  <h3 className="text-3xl font-bold text-cyan-900 mb-6 flex items-center">
                    <span className="text-4xl mr-4">📋</span>
                    Immigration & Relocation Offices
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="bg-cyan-100 rounded-xl p-6 border-l-4 border-cyan-500">
                      <h4 className="text-2xl font-bold text-cyan-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🚗</span>
                        PennDOT Driver & Vehicle Services (DMV)
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-cyan-800 mb-3">Services</h5>
                          <p className="text-lg text-cyan-700 mb-3">Driver's license, state ID, vehicle registration, REAL ID, and photo services</p>
                          <p className="text-base text-cyan-600 mb-3"><strong>Nearest Location:</strong> 708 Smithfield Street, Pittsburgh, PA 15222</p>
                          <p className="text-base text-cyan-600 mb-3">Walk-in accepted for most services. Appointments may be required for road tests or REAL ID setup</p>
                          <a href="https://www.dmv.pa.gov/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-lg font-medium">PA DMV – Find a Location →</a>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-cyan-800 mb-3">Required Documents for New Immigrants</h5>
                          <p className="text-base text-cyan-600 mb-2"><strong>Proof of Identity & Legal Presence:</strong> Valid Passport, I-94 Record, Green Card (if applicable) OR Immigration status documents</p>
                          <p className="text-base text-cyan-600 mb-2"><strong>Proof of Social Security:</strong> Social Security Card (or SSA ineligibility letter)</p>
                          <p className="text-base text-cyan-600 mb-2"><strong>Proof of PA Residency (two required):</strong> Lease agreement, utility bill, bank statement, letter from PA college</p>
                          <p className="text-base text-cyan-600"><strong>For Driver's License:</strong> Must pass knowledge test and road test. All documents must be originals, not copies</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 rounded-xl p-6 border-l-4 border-blue-500">
                      <h4 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
                        <span className="text-3xl mr-3">🆔</span>
                        Social Security Administration (SSA)
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">Services</h5>
                          <p className="text-lg text-blue-700 mb-3">Apply for SSN, replace SSN card, update information</p>
                          <p className="text-base text-blue-600 mb-3"><strong>Nearest Office:</strong> 6117 Station Street, Pittsburgh, PA 15206 (East Liberty)</p>
                          <p className="text-base text-blue-600 mb-3">Appointment required for almost all services (including new SSN applications)</p>
                          <a href="https://www.ssa.gov/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-lg font-medium">SSA – Make an Appointment →</a>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                          <h5 className="text-xl font-semibold text-blue-800 mb-3">Required Documents for SSN</h5>
                          <p className="text-base text-blue-600 mb-2"><strong>Identity:</strong> Valid Passport, U.S. Visa (if applicable), I-94 Arrival/Departure Record</p>
                          <p className="text-base text-blue-600 mb-2"><strong>Student/Scholar docs:</strong> I-20 (F-1) or DS-2019 (J-1) if applicable, EAD if required</p>
                          <p className="text-base text-blue-600"><strong>Address:</strong> Proof of local address (lease, utility bill, official mail). SSA requires original documents, not photocopies</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-100 rounded-xl p-6 border border-yellow-300">
                      <p className="text-xl text-yellow-800 text-center font-medium flex items-center justify-center">
                        <span className="text-3xl mr-3">💡</span>
                        Bring original documents, not copies! Check online for specific requirements and to make appointments.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Default message when no section is selected */}
              {!Object.values(expandedSubSections).some(Boolean) && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">👆</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-4">Choose a topic above to get started!</h3>
                  <p className="text-lg text-gray-600">Click on any category to see detailed information that will help you settle into Pittsburgh's Jewish community.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Our Programs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => {
                const eventsSection = document.getElementById('events');
                if (eventsSection) {
                  eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-200 text-left w-full cursor-pointer hover:from-blue-100 hover:to-blue-150"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-xl">🏠</div>
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-3">Weekly Shabbat Dinners</h3>
              <p className="text-blue-700 text-base">Intimate Friday night gatherings that provide a sense of family, belonging, and Jewish connection.</p>
              <div className="mt-3 text-blue-600 text-sm font-medium flex items-center">
                <span>Learn more about our events</span>
                <span className="ml-2">→</span>
            </div>
            </button>
            <button 
              onClick={() => {
                const getInfoSection = document.getElementById('get-information');
                if (getInfoSection) {
                  getInfoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-200 text-left w-full cursor-pointer hover:from-blue-100 hover:to-blue-150"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-xl">🚚</div>
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-3">Relocation Support</h3>
              <p className="text-blue-700 text-base">Help with housing, schools, summer camps, and navigating local systems like DMV and medical insurance.</p>
              <div className="mt-3 text-blue-600 text-sm font-medium flex items-center">
                <span>Get detailed information</span>
                <span className="ml-2">→</span>
            </div>
            </button>
            <button 
              onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-200 text-left w-full cursor-pointer hover:from-blue-100 hover:to-blue-150"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-xl">🚑</div>
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-3">Medical Treatment Support</h3>
              <p className="text-blue-700 text-base">Temporary housing, meals, and emotional companionship for Israeli families during medical emergencies.</p>
              <div className="mt-3 text-blue-600 text-sm font-medium flex items-center">
                <span>Contact us for support</span>
                <span className="ml-2">→</span>
            </div>
            </button>
            <button 
              onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-200 text-left w-full cursor-pointer hover:from-blue-100 hover:to-blue-150"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-xl">👶</div>
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-3">Postpartum Support</h3>
              <p className="text-blue-700 text-base">Home-cooked Israeli meals delivered to new mothers with no local family support.</p>
              <div className="mt-3 text-blue-600 text-sm font-medium flex items-center">
                <span>Contact us for support</span>
                <span className="ml-2">→</span>
            </div>
            </button>
          </div>
        </div>
      </section>


      {/* Events Section */}
      <section id="events" className="py-16 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 right-10 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        </div>
        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Upcoming Events</h2>
            <p className="text-xl text-blue-100 mb-4 max-w-3xl mx-auto">
              Join us for meaningful community gatherings and celebrations. All events are open to the community.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Shabbat Dinner Event */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🕯️</div>
                <h3 className="text-2xl font-bold mb-2">Shabbat Dinner</h3>
                <p className="text-blue-100 text-lg">September 19, 2025</p>
                <p className="text-blue-200 text-sm">כו אלול, פרשת ניצבים</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Event Details</h4>
                  <p className="text-blue-100 text-sm">Join us for a warm, intimate Shabbat dinner in our community home. All are welcome to experience the joy of Shabbat together.</p>
                </div>
                
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Optional Contribution</h4>
                  <p className="text-blue-100 text-sm mb-3">Help cover event costs with an optional $15 contribution</p>
                  <p className="text-blue-200 text-sm mb-4 font-medium">Send money to Moshe Mash (412-626-1676) via Venmo, Zelle, or by using the buttons below.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a 
                      href="https://venmo.com/code?user_id=2798159784837120312&created=1757903028" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
                    >
                      💙 Venmo
                    </a>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
                      onClick={() => {
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                        modal.innerHTML = `
                          <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
                            <div class="text-center">
                              <h3 class="text-lg font-bold mb-4">Zelle QR Code</h3>
                              <img src="./zell_qr.jpg" alt="Zelle QR Code" class="w-64 h-64 mx-auto mb-4 rounded-lg" />
                              <p class="text-sm text-gray-600 mb-4">Scan with your banking app</p>
                              <button onclick="this.closest('.fixed').remove()" class="bg-blue-600 text-white px-4 py-2 rounded-lg">Close</button>
                            </div>
                          </div>
                        `;
                        document.body.appendChild(modal);
                      }}
                    >
                      💙 Zelle QR
                    </button>
                  </div>
                </div>
                
                <a 
                  href="https://dinners.onetable.org/events/d3cafe58-df31-4891-b43b-93eeb2654971/details?shared=true" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg text-center font-semibold transition-colors"
                >
                  Join Event →
                </a>
              </div>
            </div>

            {/* Erev Rosh Hashana Event */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🍎</div>
                <h3 className="text-2xl font-bold mb-2">Erev Rosh Hashana</h3>
                <p className="text-blue-100 text-lg">September 22, 2025</p>
                <p className="text-blue-200 text-sm">כט אלול</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Event Details</h4>
                  <p className="text-blue-100 text-sm">Welcome the Jewish New Year with our community. A special evening of reflection, celebration, and traditional Rosh Hashana foods.</p>
                </div>
                
                <div className="bg-white/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Optional Contribution</h4>
                  <p className="text-blue-100 text-sm mb-3">Help cover event costs with an optional $15 contribution</p>
                  <p className="text-blue-200 text-sm mb-4 font-medium">Send money to Moshe Mash (412-626-1676) via Venmo, Zelle, or by using the buttons below.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a 
                      href="https://venmo.com/code?user_id=2798159784837120312&created=1757903028" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
                    >
                      💙 Venmo
                    </a>
                    <button 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
                      onClick={() => {
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                        modal.innerHTML = `
                          <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
                            <div class="text-center">
                              <h3 class="text-lg font-bold mb-4">Zelle QR Code</h3>
                              <img src="./zell_qr.jpg" alt="Zelle QR Code" class="w-64 h-64 mx-auto mb-4 rounded-lg" />
                              <p class="text-sm text-gray-600 mb-4">Scan with your banking app</p>
                              <button onclick="this.closest('.fixed').remove()" class="bg-blue-600 text-white px-4 py-2 rounded-lg">Close</button>
                            </div>
                          </div>
                        `;
                        document.body.appendChild(modal);
                      }}
                    >
                      💙 Zelle QR
                    </button>
                  </div>
                </div>
                
                <a 
                  href="https://forms.gle/dbEdFtQvTmFXBpSS6" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg text-center font-semibold transition-colors"
                >
                  Join Event →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 bg-white relative">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">About Us – Lev Echad</h2>
          
          <div className="bg-blue-50 rounded-3xl p-10 border border-blue-200 shadow-lg">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">💙</div>
            </div>
            
            <div className="space-y-6 text-lg text-blue-900 leading-relaxed">
              <p className="text-xl font-medium text-blue-800">
                Seven years ago, we arrived in Pittsburgh with a baby in our arms, completely alone—without family, without friends, and without anyone to rely on. The beginning was hard and often frustrating. Every small task felt overwhelming, and the sense of isolation was real.
              </p>
              
              <p className="text-xl font-medium text-blue-800">
                From that struggle, however, something powerful began to take shape. We realized that no one should ever have to face those challenges on their own. Out of our experience grew a vision: to create a place where newcomers would immediately feel embraced, supported, and part of a community.
              </p>
              
              <div className="bg-blue-100 rounded-2xl p-8 border-l-4 border-blue-500 mt-8">
                <p className="text-2xl font-bold text-blue-900 text-center italic">
                  Our struggle became our mission: to turn loneliness into belonging and isolation into community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent"></div>
        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <h2 className="text-4xl font-bold text-center mb-12">Get In Touch</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="text-blue-600">📧</div>
                <div>
                  <p className="font-medium">Email</p>
                  <a href="mailto:mashshosh@gmail.com" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                    mashshosh@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-blue-600">📞</div>
                <div>
                  <p className="font-medium">Phone</p>
                  <a href="tel:+14126261823" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
                    412-626-1823
                  </a>
                  <div className="flex gap-2 mt-2">
                    <a 
                      href="sms:+14126261823" 
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                    >
                      📱 SMS
                    </a>
                    <a 
                      href="https://wa.me/14126261823" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Better to text than call - I'm often not available for calls</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-blue-600">📍</div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-gray-600">Squirrel Hill, Pittsburgh, PA</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Send us a message</h3>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="text-green-600 text-4xl mb-4">✓</div>
                  <h4 className="text-lg font-semibold text-green-600 mb-2">Message Sent!</h4>
                  <p className="text-gray-600">Thank you for contacting us. We'll get back to you soon!</p>
                  <p className="text-gray-500 text-sm mt-2">A copy of your message has been sent to your email.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required
                  />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your email" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                    required
                  />
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Your message" 
                    rows={4} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  ></textarea>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="./logo.jpg" alt="Lev Echad Logo" className="h-8 w-8 rounded-full object-cover shadow-lg" />
            <span className="text-lg font-bold">Lev Echad</span>
          </div>
          <p className="text-blue-200 mb-4">A Home Away from Home for Jewish and Israeli Pittsburghers</p>
          <p className="text-blue-300 text-sm">© {new Date().getFullYear()} Lev Echad. All rights reserved.</p>
        </div>
      </footer>
      
      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  )
}

export default App