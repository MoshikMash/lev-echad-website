import { useState } from 'react'

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentHoliday, setCurrentHoliday] = useState(0);

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

  // Holiday meals data with amounts
  const holidayMeals = [
    {
      name: "Rosh Hashanah",
      days: "2 days",
      amount: "$800",
      description: "Traditional New Year meals for the community",
      emoji: "🍎"
    },
    {
      name: "Yom Kippur",
      days: "Break-fast",
      amount: "$400",
      description: "Break-fast meal after the Day of Atonement",
      emoji: "🕊️"
    },
    {
      name: "Sukkot",
      days: "8 days",
      amount: "$1,200",
      description: "Eight days of Sukkah celebrations and meals",
      emoji: "🏠"
    },
    {
      name: "Simchat Torah",
      days: "1 day",
      amount: "$300",
      description: "Rejoicing with the Torah celebration",
      emoji: "📜"
    }
  ];

  const nextHoliday = () => {
    setCurrentHoliday((prev) => (prev + 1) % holidayMeals.length);
  };

  const prevHoliday = () => {
    setCurrentHoliday((prev) => (prev - 1 + holidayMeals.length) % holidayMeals.length);
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
            <a href="#about" className="hover:text-blue-700 transition-colors">About</a>
            <a href="#programs" className="hover:text-blue-700 transition-colors">Programs</a>
            <a href="#goals" className="hover:text-blue-700 transition-colors">Upcoming Goals</a>
            <a href="#donate" className="hover:text-blue-700 transition-colors">Donate</a>
            <a href="#contact" className="hover:text-blue-700 transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <button className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
              <a href="#donate">Donate</a>
            </button>
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
              Lev Echad fills a gap among community organizations by offering belonging, emotional support,
              and Jewish connection through intimate weekly Shabbat dinners and personalized care.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                Weekly Shabbat Dinners
              </span>
              <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                Relocation Support
              </span>
              <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                Medical Assistance
              </span>
              <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                Postpartum Meals
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="rounded-2xl bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 font-medium">
                <a href="#volunteer">Join Us</a>
              </button>
              <button className="rounded-2xl border border-white text-white hover:bg-white/10 px-8 py-3 font-medium">
                <a href="#donate">Donate Now →</a>
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="max-w-lg w-full">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="text-center">
                  <div className="text-4xl text-white mb-4">💙</div>
                  <blockquote className="text-lg text-white italic mb-6 leading-relaxed">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  <div className="text-blue-100">
                    <p className="font-semibold">{testimonials[currentTestimonial].author}</p>
                    <p className="text-sm opacity-80">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
                
                {/* Navigation arrows */}
                <div className="flex justify-between items-center mt-6">
                  <button 
                    onClick={prevTestimonial}
                    className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white/10"
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
                          index === currentTestimonial ? 'bg-white' : 'bg-white/40'
                        }`}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  <button 
                    onClick={nextTestimonial}
                    className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white/10"
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

      {/* About Section */}
      <section id="about" className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-8">About Lev Echad</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-lg">
                Founded by Shosh Mash, an Israeli mother, educator, and community builder, Lev Echad reflects the power of feeling truly welcomed.
              </p>
              <p className="text-lg">
                Through intimate Shabbat dinners, we create space for connection, emotional support, cultural identity, and lasting friendships.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Our Services</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="text-blue-600">🏠</div>
                  Weekly Shabbat Dinners
                </li>
                <li className="flex items-center gap-2">
                  <div className="text-blue-600">🚚</div>
                  Relocation Support
                </li>
                <li className="flex items-center gap-2">
                  <div className="text-blue-600">🚑</div>
                  Medical Treatment Support
                </li>
                <li className="flex items-center gap-2">
                  <div className="text-blue-600">👶</div>
                  Postpartum Support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Programs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-xl">🏠</div>
              </div>
              <h3 className="font-semibold text-blue-900 mb-2">Weekly Shabbat Dinners</h3>
              <p className="text-blue-700 text-sm">Intimate Friday night gatherings that provide a sense of family, belonging, and Jewish connection.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-xl">🚚</div>
              </div>
              <h3 className="font-semibold text-blue-900 mb-2">Relocation Support</h3>
              <p className="text-blue-700 text-sm">Help with housing, schools, summer camps, and navigating local systems like DMV and medical insurance.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-xl">🚑</div>
              </div>
              <h3 className="font-semibold text-blue-900 mb-2">Medical Treatment</h3>
              <p className="text-blue-700 text-sm">Temporary housing, meals, and emotional companionship for Israeli families during medical emergencies.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <div className="text-white text-xl">👶</div>
              </div>
              <h3 className="font-semibold text-blue-900 mb-2">Postpartum Support</h3>
              <p className="text-blue-700 text-sm">Home-cooked Israeli meals delivered to new mothers with no local family support.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Goals Section */}
      <section id="goals" className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">Upcoming Goals</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We're preparing for the Tishrei holidays and have exciting plans to bring our community together
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Holiday Meals Carousel */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl">
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">🍂</div>
                <h3 className="text-2xl font-bold">Tishrei Holidays Meals</h3>
                <p className="text-blue-100 text-sm mt-2">Help us provide meals for all the holidays</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-center">
                  <div className="text-4xl mb-4">{holidayMeals[currentHoliday].emoji}</div>
                  <h4 className="text-xl font-bold mb-2">{holidayMeals[currentHoliday].name}</h4>
                  <p className="text-blue-200 text-sm mb-3">{holidayMeals[currentHoliday].days}</p>
                  <p className="text-blue-100 mb-4">{holidayMeals[currentHoliday].description}</p>
                  <div className="bg-white/20 rounded-lg p-4">
                    <p className="text-sm text-blue-100 mb-1">Cost for this holiday</p>
                    <p className="text-3xl font-bold">{holidayMeals[currentHoliday].amount}</p>
                  </div>
                </div>
                
                {/* Navigation arrows */}
                <div className="flex justify-between items-center mt-6">
                  <button 
                    onClick={prevHoliday}
                    className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white/10"
                    aria-label="Previous holiday"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="flex space-x-2">
                    {holidayMeals.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentHoliday(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentHoliday ? 'bg-white' : 'bg-white/40'
                        }`}
                        aria-label={`Go to ${holidayMeals[index].name}`}
                      />
                    ))}
                  </div>
                  
                  <button 
                    onClick={nextHoliday}
                    className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white/10"
                    aria-label="Next holiday"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Sukkah Project */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-white shadow-2xl">
              <div className="text-center">
                <div className="text-4xl mb-4">🏠</div>
                <h4 className="text-2xl font-bold mb-3">Community Sukkah Project</h4>
                <p className="text-green-100 mb-6">
                  We're building a large Sukkah that can accommodate 40-50 people for community celebrations
                </p>
                <div className="bg-white/20 rounded-lg p-6">
                  <p className="text-sm text-green-100 mb-2">Goal Amount</p>
                  <p className="text-3xl font-bold">$5,000</p>
                  <p className="text-xs text-green-200 mt-2">For Sukkah materials and setup</p>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-green-100 text-sm">Total Holiday Budget</p>
                  <p className="text-2xl font-bold">$2,700</p>
                  <p className="text-xs text-green-200">For all Tishrei holiday meals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donate Section */}
      <section id="donate" className="py-16 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 right-10 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        </div>
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Support Lev Echad</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              At this stage, Shosh personally covers all the costs associated with each Shabbat dinner — including food, supplies, preparation, and cleaning services. 
              To continue offering meaningful, high-quality Shabbat experiences, Lev Echad needs your support.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">$15</h3>
                <p className="text-blue-100 text-sm">Cover a bottle of wine for Shabbat</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">$20</h3>
                <p className="text-blue-100 text-sm">Cover challah for Shabbat dinner</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">$25</h3>
                <p className="text-blue-100 text-sm">Cover one person for Shabbat dinner</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">$60</h3>
                <p className="text-blue-100 text-sm">Cover a bottle of vodka</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">$80</h3>
                <p className="text-blue-100 text-sm">Cover a bottle of whiskey</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">$100</h3>
                <p className="text-blue-100 text-sm">Cover a family for Shabbat dinner</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">$300</h3>
                <p className="text-blue-100 text-sm">Cover weekly groceries for Shabbat dinner</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">$50-$300</h3>
                <p className="text-green-100 text-sm">Help build our community Sukkah</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-bold mb-2">Custom</h3>
                <p className="text-purple-100 text-sm">Any amount to be part of our mission</p>
              </div>
            </div>
            <div className="flex justify-center">
              <button className="rounded-2xl bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 font-medium">
                <a href="https://donate.levechad.org" target="_blank" rel="noopener noreferrer">
                  Donate Now
                </a>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent"></div>
        <div className="mx-auto max-w-6xl px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-12">Get In Touch</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="text-blue-600">📧</div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">mashshosh@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-blue-600">📞</div>
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-gray-600">412-626-1823</p>
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
    </div>
  )
}

export default App